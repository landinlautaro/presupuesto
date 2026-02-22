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
}
