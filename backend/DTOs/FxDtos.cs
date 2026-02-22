namespace PresupuestoApi.DTOs;

/// <summary>Body para PUT /fx/{mes} (upsert).</summary>
public record FxUpsertRequest(
    decimal? Oficial,
    decimal? Mep,
    decimal? Ccl,
    decimal? Blue,
    string?  Notas
);

/// <summary>Respuesta de GET /fx/cotizacion-actual (no se persiste).</summary>
public record CotizacionActualResponse(
    decimal? Oficial,
    decimal? Mep,
    decimal? Ccl,
    decimal? Blue
);
