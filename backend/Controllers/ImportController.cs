using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PresupuestoApi.Services;

namespace PresupuestoApi.Controllers;

[ApiController]
[Route("import")]
[Authorize]
public class ImportController : ControllerBase
{
    private readonly ImportService _importService;

    public ImportController(ImportService importService) => _importService = importService;

    /// <summary>
    /// Importa un archivo .xlsx con las hojas "Movimientos", "Asignacion" y/o "FX".
    /// Las hojas que no existan en el archivo se ignoran sin error.
    /// Movimientos y Asignacion: INSERT. FX: UPSERT por mes.
    /// </summary>
    [HttpPost("xlsx")]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)] // 10 MB
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> ImportXlsx(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Se requiere un archivo .xlsx" });

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "El archivo debe tener extensión .xlsx" });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _importService.ImportAsync(stream);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error al procesar el archivo: {ex.Message}" });
        }
    }
}
