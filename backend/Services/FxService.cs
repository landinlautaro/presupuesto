using System.Net.Http.Json;
using PresupuestoApi.DTOs;

namespace PresupuestoApi.Services;

public class FxService
{
    private readonly HttpClient _http;

    public FxService(HttpClient http) => _http = http;

    /// <summary>
    /// Consulta dolarapi.com y devuelve las cotizaciones actuales.
    /// No persiste nada en la base de datos.
    /// </summary>
    public async Task<CotizacionActualResponse> GetCotizacionActualAsync()
    {
        // GET https://dolarapi.com/v1/dolares
        // Devuelve: [{ "casa": "oficial", "venta": 1234.5 }, ...]
        // Mapeo: oficial→"oficial", mep→"bolsa", ccl→"contadoconliqui", blue→"blue"
        List<DolarApiItem>? items;
        try
        {
            items = await _http.GetFromJsonAsync<List<DolarApiItem>>(
                "https://dolarapi.com/v1/dolares");
        }
        catch (Exception ex)
        {
            throw new HttpRequestException(
                $"Error al consultar dolarapi.com: {ex.Message}", ex);
        }

        if (items is null || items.Count == 0)
            throw new HttpRequestException("dolarapi.com devolvió una respuesta vacía");

        decimal? GetVenta(string casa) =>
            items.FirstOrDefault(x =>
                string.Equals(x.Casa, casa, StringComparison.OrdinalIgnoreCase))?.Venta;

        return new CotizacionActualResponse(
            Oficial: GetVenta("oficial"),
            Mep:     GetVenta("bolsa"),
            Ccl:     GetVenta("contadoconliqui"),
            Blue:    GetVenta("blue")
        );
    }

    // DTO interno para deserializar la respuesta de dolarapi.com
    private sealed record DolarApiItem(string Casa, decimal? Venta);
}
