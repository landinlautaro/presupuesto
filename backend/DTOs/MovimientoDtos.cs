using System.ComponentModel.DataAnnotations;

namespace PresupuestoApi.DTOs;

public class MovimientoRequest
{
    [Required] public DateOnly Fecha { get; init; }
    [Required, MaxLength(10)] public string Tipo { get; init; } = default!;
    [Required, MaxLength(50)] public string Categoria { get; init; } = default!;
    [Required] public string Descripcion { get; init; } = default!;
    [Range(0.01, double.MaxValue)] public decimal MontoArs { get; init; }
    [MaxLength(100)] public string? CuentaMedio { get; init; }
}
