using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Data;
using PresupuestoApi.DTOs;
using PresupuestoApi.Models;
using PresupuestoApi.Services;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("fx")]
[Authorize]
public class FxController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FxService   _fxService;

    public FxController(AppDbContext db, FxService fxService)
    {
        _db        = db;
        _fxService = fxService;
    }

    /// <summary>
    /// Lista todos los meses de FX guardados, ordenados por mes.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _db.Fx
            .OrderBy(f => f.Mes)
            .ToListAsync();
        return Ok(result);
    }

    /// <summary>
    /// Cotización en tiempo real desde dolarapi.com. No se guarda en DB.
    /// Rutas literales tienen prioridad sobre {mes}, por lo que no hay conflicto.
    /// </summary>
    [HttpGet("cotizacion-actual")]
    public async Task<IActionResult> GetCotizacionActual()
    {
        try
        {
            var cotizacion = await _fxService.GetCotizacionActualAsync();
            return Ok(cotizacion);
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(502, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Devuelve el registro FX de un mes específico (ej: 2026-01).
    /// </summary>
    [HttpGet("{mes}")]
    public async Task<IActionResult> GetByMes(string mes)
    {
        var fx = await _db.Fx.FirstOrDefaultAsync(f => f.Mes == mes);
        if (fx is null) return NotFound(new { message = $"No hay FX para el mes {mes}" });
        return Ok(fx);
    }

    /// <summary>
    /// Crea o actualiza (upsert) el registro FX de un mes.
    /// PUT /fx/2026-01
    /// </summary>
    [HttpPut("{mes}")]
    public async Task<IActionResult> Upsert(string mes, [FromBody] FxUpsertRequest req)
    {
        var fx = await _db.Fx.FirstOrDefaultAsync(f => f.Mes == mes);

        if (fx is null)
        {
            fx = new Fx { Mes = mes };
            _db.Fx.Add(fx);
        }

        fx.Oficial    = req.Oficial;
        fx.Mep        = req.Mep;
        fx.Ccl        = req.Ccl;
        fx.Blue       = req.Blue;
        fx.Notas      = req.Notas;
        fx.UpdatedAt  = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(fx);
    }
}
