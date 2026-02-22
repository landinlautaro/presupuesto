using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PresupuestoApi.Models;

[Table("asignacion")]
public class Asignacion
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("fecha")]
    public DateOnly Fecha { get; set; }

    [Column("mes")]
    [MaxLength(7)]
    public string Mes { get; set; } = string.Empty;

    [Column("activo")]
    [MaxLength(50)]
    public string Activo { get; set; } = string.Empty;

    [Column("monto_ars", TypeName = "decimal(18,2)")]
    public decimal MontoArs { get; set; }

    [Column("fx_tipo")]
    [MaxLength(10)]
    public string FxTipo { get; set; } = string.Empty; // "Oficial" | "MEP" | "CCL" | "Blue"

    [Column("tc", TypeName = "decimal(18,4)")]
    public decimal Tc { get; set; }

    [Column("monto_usd", TypeName = "decimal(18,4)")]
    public decimal MontoUsd { get; set; }

    [Column("nota")]
    public string? Nota { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
