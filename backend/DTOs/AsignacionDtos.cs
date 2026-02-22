using System.ComponentModel.DataAnnotations;

namespace PresupuestoApi.DTOs;

public class AsignacionRequest
{
    [Required] public DateOnly Fecha { get; init; }
    [Required, MaxLength(50)] public string Activo { get; init; } = default!;
    [Range(0.01, double.MaxValue)] public decimal MontoArs { get; init; }
    [Required, MaxLength(10)] public string FxTipo { get; init; } = default!;
    [Range(0.0001, double.MaxValue)] public decimal Tc { get; init; }
    [MaxLength(200)] public string? Nota { get; init; }
}
