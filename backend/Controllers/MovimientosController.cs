using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Data;
using PresupuestoApi.DTOs;
using PresupuestoApi.Models;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("movimientos")]
[Authorize]
public class MovimientosController : ControllerBase
{
    private readonly AppDbContext _db;

    public MovimientosController(AppDbContext db) => _db = db;

    /// <summary>
    /// Lista movimientos. Si se pasa ?mes=YYYY-MM filtra por ese mes.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? mes)
    {
        var query = _db.Movimientos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(mes))
            query = query.Where(m => m.Mes == mes);

        var result = await query
            .OrderBy(m => m.Fecha)
            .ThenBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(result);
    }

    /// <summary>
    /// Crea un movimiento. El campo 'mes' se deriva de 'fecha'.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MovimientoRequest req)
    {
        var movimiento = new Movimiento
        {
            Fecha       = req.Fecha,
            Mes         = req.Fecha.ToString("yyyy-MM"),
            Tipo        = req.Tipo,
            Categoria   = req.Categoria,
            Descripcion = req.Descripcion,
            MontoArs    = req.MontoArs,
            CuentaMedio = req.CuentaMedio,
            //Tags        = req.Tags
        };

        _db.Movimientos.Add(movimiento);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { mes = movimiento.Mes }, movimiento);
    }

    /// <summary>
    /// Actualiza un movimiento existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MovimientoRequest req)
    {
        var movimiento = await _db.Movimientos.FindAsync(id);
        if (movimiento is null) return NotFound();

        movimiento.Fecha       = req.Fecha;
        movimiento.Mes         = req.Fecha.ToString("yyyy-MM");
        movimiento.Tipo        = req.Tipo;
        movimiento.Categoria   = req.Categoria;
        movimiento.Descripcion = req.Descripcion;
        movimiento.MontoArs    = req.MontoArs;
        movimiento.CuentaMedio = req.CuentaMedio;
        //movimiento.Tags        = req.Tags;

        await _db.SaveChangesAsync();
        return Ok(movimiento);
    }

    /// <summary>
    /// Elimina un movimiento.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var movimiento = await _db.Movimientos.FindAsync(id);
        if (movimiento is null) return NotFound();

        _db.Movimientos.Remove(movimiento);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
