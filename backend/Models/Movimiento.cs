using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PresupuestoApi.Models;

[Table("movimientos")]
public class Movimiento
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("fecha")]
    public DateOnly Fecha { get; set; }

    [Column("mes")]
    [MaxLength(7)]
    public string Mes { get; set; } = string.Empty;

    [Column("tipo")]
    [MaxLength(10)]
    public string Tipo { get; set; } = string.Empty; // "Ingreso" | "Egreso"

    [Column("categoria")]
    [MaxLength(50)]
    public string Categoria { get; set; } = string.Empty;

    [Column("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [Column("monto_ars", TypeName = "decimal(18,2)")]
    public decimal MontoArs { get; set; }

    [Column("cuenta_medio")]
    [MaxLength(100)]
    public string? CuentaMedio { get; set; }

    [Column("tags")]
    [MaxLength(200)]
    public string? Tags { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
