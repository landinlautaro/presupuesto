namespace PresupuestoApi.DTOs;

/// <summary>Resultado devuelto por POST /import/xlsx.</summary>
public record ImportResultResponse(
    int MovimientosInsertados,
    int AsignacionInsertados,
    int FxUpsertados
);
