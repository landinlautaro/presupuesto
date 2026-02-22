using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Data;
using PresupuestoApi.DTOs;
using PresupuestoApi.Models;

namespace PresupuestoApi.Services;

public class ImportService
{
    private readonly AppDbContext _db;

    public ImportService(AppDbContext db) => _db = db;

    /// <summary>
    /// Parsea las hojas "Movimientos", "Asignacion" y "FX" del .xlsx y las persiste.
    /// - Movimientos / Asignacion: INSERT (cada fila es un registro nuevo).
    /// - FX: UPSERT por mes (mes es clave única).
    /// Las filas malformadas se saltean silenciosamente.
    /// </summary>
    public async Task<ImportResultResponse> ImportAsync(Stream stream)
    {
        using var wb = new XLWorkbook(stream);

        var movsCount = wb.TryGetWorksheet("Movimientos", out var wsMovs)
            ? await ImportMovimientosAsync(wsMovs)
            : 0;

        var asigCount = wb.TryGetWorksheet("Asignacion", out var wsAsig)
            ? await ImportAsignacionAsync(wsAsig)
            : 0;

        var fxCount = wb.TryGetWorksheet("FX", out var wsFx)
            ? await ImportFxAsync(wsFx)
            : 0;

        return new ImportResultResponse(movsCount, asigCount, fxCount);
    }

    // ── Movimientos ───────────────────────────────────────────────────────────
    // Columnas: Fecha | Mes_YYYY-MM | Tipo | Categoria | Descripcion | Monto_ARS | Cuenta/Medio | Tags

    private async Task<int> ImportMovimientosAsync(IXLWorksheet ws)
    {
        var list = new List<Movimiento>();

        foreach (var row in ws.RowsUsed().Skip(1)) // Skip(1) = saltar encabezado
        {
            if (row.IsEmpty()) continue;
            try
            {
                var fecha     = DateOnly.FromDateTime(row.Cell(1).GetValue<DateTime>());
                var mesRaw    = StringOrNull(row.Cell(2));
                var mes       = string.IsNullOrEmpty(mesRaw) ? fecha.ToString("yyyy-MM") : mesRaw;
                var tipo      = row.Cell(3).GetValue<string>().Trim();
                var categoria = row.Cell(4).GetValue<string>().Trim();
                var descr     = row.Cell(5).GetValue<string>().Trim();
                var montoArs  = row.Cell(6).GetValue<decimal>();
                var cuenta    = StringOrNull(row.Cell(7));
                var tags      = StringOrNull(row.Cell(8));

                if (string.IsNullOrWhiteSpace(tipo) || string.IsNullOrWhiteSpace(categoria))
                    continue;

                list.Add(new Movimiento
                {
                    Fecha       = fecha,
                    Mes         = mes,
                    Tipo        = tipo,
                    Categoria   = categoria,
                    Descripcion = descr,
                    MontoArs    = montoArs,
                    CuentaMedio = cuenta,
                    Tags        = tags
                });
            }
            catch { /* fila malformada — se saltea */ }
        }

        _db.Movimientos.AddRange(list);
        await _db.SaveChangesAsync();
        return list.Count;
    }

    // ── Asignacion ────────────────────────────────────────────────────────────
    // Columnas: Fecha | Mes_YYYY-MM | Activo | Monto_ARS | FX_Tipo | TC | Monto_USD | Nota
    //                                                                      ↑ col 7 se ignora: se recalcula

    private async Task<int> ImportAsignacionAsync(IXLWorksheet ws)
    {
        var list = new List<Asignacion>();

        foreach (var row in ws.RowsUsed().Skip(1))
        {
            if (row.IsEmpty()) continue;
            try
            {
                var fecha    = DateOnly.FromDateTime(row.Cell(1).GetValue<DateTime>());
                var mesRaw   = StringOrNull(row.Cell(2));
                var mes      = string.IsNullOrEmpty(mesRaw) ? fecha.ToString("yyyy-MM") : mesRaw;
                var activo   = row.Cell(3).GetValue<string>().Trim();
                var montoArs = row.Cell(4).GetValue<decimal>();
                var fxTipo   = row.Cell(5).GetValue<string>().Trim();
                var tc       = row.Cell(6).GetValue<decimal>();
                // col 7 = Monto_USD del Excel — se ignora, se recalcula
                var nota     = StringOrNull(row.Cell(8));

                if (string.IsNullOrWhiteSpace(activo)) continue;

                var montoUsd = tc > 0 ? Math.Round(montoArs / tc, 4) : 0m;

                list.Add(new Asignacion
                {
                    Fecha    = fecha,
                    Mes      = mes,
                    Activo   = activo,
                    MontoArs = montoArs,
                    FxTipo   = fxTipo,
                    Tc       = tc,
                    MontoUsd = montoUsd,
                    Nota     = nota
                });
            }
            catch { /* fila malformada — se saltea */ }
        }

        _db.Asignaciones.AddRange(list);
        await _db.SaveChangesAsync();
        return list.Count;
    }

    // ── FX ────────────────────────────────────────────────────────────────────
    // Columnas: Mes_YYYY-MM | Oficial | MEP | CCL | Blue | Notas
    // Upsert por mes (mes es UNIQUE en la tabla).

    private async Task<int> ImportFxAsync(IXLWorksheet ws)
    {
        var parsed = new List<(string Mes, decimal? Oficial, decimal? Mep, decimal? Ccl, decimal? Blue, string? Notas)>();

        foreach (var row in ws.RowsUsed().Skip(1))
        {
            if (row.IsEmpty()) continue;
            try
            {
                var mes = row.Cell(1).GetValue<string>().Trim();
                if (string.IsNullOrWhiteSpace(mes)) continue;

                parsed.Add((
                    Mes:     mes,
                    Oficial: DecimalOrNull(row.Cell(2)),
                    Mep:     DecimalOrNull(row.Cell(3)),
                    Ccl:     DecimalOrNull(row.Cell(4)),
                    Blue:    DecimalOrNull(row.Cell(5)),
                    Notas:   StringOrNull(row.Cell(6))
                ));
            }
            catch { /* fila malformada — se saltea */ }
        }

        if (parsed.Count == 0) return 0;

        // Cargar registros existentes en un solo query
        var meses = parsed.Select(r => r.Mes).ToList();
        var existing = await _db.Fx
            .Where(f => meses.Contains(f.Mes))
            .ToDictionaryAsync(f => f.Mes);

        foreach (var (mes, oficial, mep, ccl, blue, notas) in parsed)
        {
            if (existing.TryGetValue(mes, out var fx))
            {
                fx.Oficial   = oficial;
                fx.Mep       = mep;
                fx.Ccl       = ccl;
                fx.Blue      = blue;
                fx.Notas     = notas;
                fx.UpdatedAt = DateTimeOffset.UtcNow;
            }
            else
            {
                _db.Fx.Add(new Fx
                {
                    Mes      = mes,
                    Oficial  = oficial,
                    Mep      = mep,
                    Ccl      = ccl,
                    Blue     = blue,
                    Notas    = notas
                });
            }
        }

        await _db.SaveChangesAsync();
        return parsed.Count;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string? StringOrNull(IXLCell cell)
    {
        if (cell.IsEmpty()) return null;
        var s = cell.GetValue<string>().Trim();
        return string.IsNullOrEmpty(s) ? null : s;
    }

    private static decimal? DecimalOrNull(IXLCell cell)
    {
        if (cell.IsEmpty()) return null;
        return cell.TryGetValue(out decimal d) ? d : null;
    }
}
