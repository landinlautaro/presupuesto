using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Data;
using PresupuestoApi.DTOs;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("resumen")]
[Authorize]
public class ResumenController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResumenController(AppDbContext db) => _db = db;

    private static string[] BuildYearMonths(string year) =>
        Enumerable.Range(1, 12)
            .Select(m => $"{year}-{m:00}")
            .ToArray();

    /// <summary>
    /// Resumen financiero de un mes: ingresos, egresos, ahorro, asignado, sin asignar.
    /// Las sumas se calculan directamente en la DB (no se cargan registros en memoria).
    /// GET /resumen/2026-01
    /// </summary>
    [HttpGet("{mes}")]
    public async Task<IActionResult> GetMes(string mes)
    {
        // ── Movimientos ───────────────────────────────────────────────────────
        var ingresosArs = await _db.Movimientos
            .Where(m => m.Mes == mes && m.Tipo == "Ingreso")
            .SumAsync(m => (decimal?)m.MontoArs) ?? 0m;

        var egresosArs = await _db.Movimientos
            .Where(m => m.Mes == mes && m.Tipo == "Egreso")
            .SumAsync(m => (decimal?)m.MontoArs) ?? 0m;

        // ── Asignación ────────────────────────────────────────────────────────
        var asignadoArs = await _db.Asignaciones
            .Where(a => a.Mes == mes)
            .SumAsync(a => (decimal?)a.MontoArs) ?? 0m;

        var asignadoUsd = await _db.Asignaciones
            .Where(a => a.Mes == mes)
            .SumAsync(a => (decimal?)a.MontoUsd) ?? 0m;

        // ── Derivados ─────────────────────────────────────────────────────────
        var ahorroArs     = ingresosArs - egresosArs;
        var sinAsignarArs = ahorroArs - asignadoArs;

        // TC promedio ponderado: total_ars / total_usd
        // Refleja el costo promedio real en pesos por dólar invertido.
        var tcPromedio = asignadoUsd > 0
            ? Math.Round(asignadoArs / asignadoUsd, 4)
            : 0m;

        return Ok(new ResumenMesResponse(
            IngresosArs:   ingresosArs,
            EgresosArs:    egresosArs,
            AhorroArs:     ahorroArs,
            AsignadoArs:   asignadoArs,
            SinAsignarArs: sinAsignarArs,
            AsignadoUsd:   asignadoUsd,
            TcPromedio:    tcPromedio
        ));
    }

    /// <summary>
    /// Resumen de activos acumulado histórico (todas las asignaciones, sin filtro de mes).
    /// Agrupa por activo con total ARS, total USD y porcentaje sobre el total ARS.
    /// GET /resumen/activos
    /// Nota: ruta literal → tiene prioridad sobre /{mes}, sin conflicto de routing.
    /// </summary>
    [HttpGet("activos")]
    public async Task<IActionResult> GetActivos()
    {
        var grupos = await _db.Asignaciones
            .GroupBy(a => a.Activo)
            .Select(g => new
            {
                Activo   = g.Key,
                TotalArs = g.Sum(a => a.MontoArs),
                TotalUsd = g.Sum(a => a.MontoUsd)
            })
            .OrderByDescending(g => g.TotalArs)
            .ToListAsync();

        if (grupos.Count == 0)
            return Ok(Array.Empty<ActivoResumenItem>());

        var grandTotalArs = grupos.Sum(g => g.TotalArs);

        var result = grupos.Select(g => new ActivoResumenItem(
            Activo:     g.Activo,
            TotalArs:   g.TotalArs,
            TotalUsd:   g.TotalUsd,
            Porcentaje: grandTotalArs > 0
                ? Math.Round(g.TotalArs / grandTotalArs * 100, 2)
                : 0m
        )).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Resumen agregado para dashboard con una sola llamada:
    /// - resumen del mes seleccionado
    /// - serie ingresos/egresos del anio completo
    /// - distribucion historica de activos
    /// GET /resumen/dashboard/2026-01
    /// </summary>
    [HttpGet("dashboard/{mes}")]
    public async Task<IActionResult> GetDashboard(string mes)
    {
        var year = mes.Split('-')[0];
        var months = BuildYearMonths(year);
        var monthSet = months.ToHashSet(StringComparer.Ordinal);

        var movimientosRaw = await _db.Movimientos
            .Where(m => m.Mes.StartsWith($"{year}-"))
            .GroupBy(m => new { m.Mes, m.Tipo })
            .Select(g => new
            {
                g.Key.Mes,
                g.Key.Tipo,
                Total = g.Sum(x => x.MontoArs)
            })
            .ToListAsync();

        var ingresosByMes = movimientosRaw
            .Where(x => x.Tipo == "Ingreso" && monthSet.Contains(x.Mes))
            .GroupBy(x => x.Mes)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Total), StringComparer.Ordinal);

        var egresosByMes = movimientosRaw
            .Where(x => x.Tipo == "Egreso" && monthSet.Contains(x.Mes))
            .GroupBy(x => x.Mes)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Total), StringComparer.Ordinal);

        var asignacionByMes = await _db.Asignaciones
            .Where(a => a.Mes.StartsWith($"{year}-"))
            .GroupBy(a => a.Mes)
            .Select(g => new
            {
                Mes = g.Key,
                AsignadoArs = g.Sum(x => x.MontoArs),
                AsignadoUsd = g.Sum(x => x.MontoUsd)
            })
            .ToDictionaryAsync(x => x.Mes);

        decimal ingresosArs = ingresosByMes.TryGetValue(mes, out var i) ? i : 0m;
        decimal egresosArs = egresosByMes.TryGetValue(mes, out var e) ? e : 0m;
        decimal asignadoArs = asignacionByMes.TryGetValue(mes, out var a) ? a.AsignadoArs : 0m;
        decimal asignadoUsd = asignacionByMes.TryGetValue(mes, out var u) ? u.AsignadoUsd : 0m;

        var ahorroArs = ingresosArs - egresosArs;
        var sinAsignarArs = ahorroArs - asignadoArs;
        var tcPromedio = asignadoUsd > 0 ? Math.Round(asignadoArs / asignadoUsd, 4) : 0m;

        var resumen = new ResumenMesResponse(
            IngresosArs: ingresosArs,
            EgresosArs: egresosArs,
            AhorroArs: ahorroArs,
            AsignadoArs: asignadoArs,
            SinAsignarArs: sinAsignarArs,
            AsignadoUsd: asignadoUsd,
            TcPromedio: tcPromedio
        );

        var serieMensual = months
            .Select(month => new SerieMensualItemResponse(
                Mes: month,
                IngresosArs: ingresosByMes.TryGetValue(month, out var inMonth) ? inMonth : 0m,
                EgresosArs: egresosByMes.TryGetValue(month, out var outMonth) ? outMonth : 0m
            ))
            .ToList();

        var gruposActivos = await _db.Asignaciones
            .GroupBy(a => a.Activo)
            .Select(g => new
            {
                Activo = g.Key,
                TotalArs = g.Sum(a => a.MontoArs),
                TotalUsd = g.Sum(a => a.MontoUsd)
            })
            .OrderByDescending(g => g.TotalArs)
            .ToListAsync();

        var totalActivosArs = gruposActivos.Sum(g => g.TotalArs);
        var activos = gruposActivos
            .Select(g => new ActivoResumenItem(
                Activo: g.Activo,
                TotalArs: g.TotalArs,
                TotalUsd: g.TotalUsd,
                Porcentaje: totalActivosArs > 0
                    ? Math.Round(g.TotalArs / totalActivosArs * 100, 2)
                    : 0m
            ))
            .ToList();

        return Ok(new DashboardResumenResponse(
            Resumen: resumen,
            Activos: activos,
            SerieMensual: serieMensual
        ));
    }
}
