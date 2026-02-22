using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Data;
using PresupuestoApi.DTOs;
using PresupuestoApi.Models;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("asignacion")]
[Authorize]
public class AsignacionController : ControllerBase
{
    private readonly AppDbContext _db;

    public AsignacionController(AppDbContext db) => _db = db;

    /// <summary>
    /// Lista asignaciones. Si se pasa ?mes=YYYY-MM filtra por ese mes.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? mes)
    {
        var query = _db.Asignaciones.AsQueryable();

        if (!string.IsNullOrWhiteSpace(mes))
            query = query.Where(a => a.Mes == mes);

        var result = await query
            .OrderBy(a => a.Fecha)
            .ThenBy(a => a.CreatedAt)
            .ToListAsync();

        return Ok(result);
    }

    /// <summary>
    /// Crea una asignación. monto_usd se calcula automáticamente: monto_ars / tc.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AsignacionRequest req)
    {
        var asignacion = new Asignacion
        {
            Fecha    = req.Fecha,
            Mes      = req.Fecha.ToString("yyyy-MM"),
            Activo   = req.Activo,
            MontoArs = req.MontoArs,
            FxTipo   = req.FxTipo,
            Tc       = req.Tc,
            MontoUsd = Math.Round(req.MontoArs / req.Tc, 4),
            Nota     = req.Nota
        };

        _db.Asignaciones.Add(asignacion);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { mes = asignacion.Mes }, asignacion);
    }

    /// <summary>
    /// Actualiza una asignación. monto_usd se recalcula automáticamente.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AsignacionRequest req)
    {
        var asignacion = await _db.Asignaciones.FindAsync(id);
        if (asignacion is null) return NotFound();

        asignacion.Fecha    = req.Fecha;
        asignacion.Mes      = req.Fecha.ToString("yyyy-MM");
        asignacion.Activo   = req.Activo;
        asignacion.MontoArs = req.MontoArs;
        asignacion.FxTipo   = req.FxTipo;
        asignacion.Tc       = req.Tc;
        asignacion.MontoUsd = Math.Round(req.MontoArs / req.Tc, 4);
        asignacion.Nota     = req.Nota;

        await _db.SaveChangesAsync();
        return Ok(asignacion);
    }

    /// <summary>
    /// Elimina una asignación.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var asignacion = await _db.Asignaciones.FindAsync(id);
        if (asignacion is null) return NotFound();

        _db.Asignaciones.Remove(asignacion);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
