using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PresupuestoApi.Models;

[Table("fx")]
public class Fx
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("mes")]
    [MaxLength(7)]
    public string Mes { get; set; } = string.Empty;

    [Column("oficial", TypeName = "decimal(18,4)")]
    public decimal? Oficial { get; set; }

    [Column("mep", TypeName = "decimal(18,4)")]
    public decimal? Mep { get; set; }

    [Column("ccl", TypeName = "decimal(18,4)")]
    public decimal? Ccl { get; set; }

    [Column("blue", TypeName = "decimal(18,4)")]
    public decimal? Blue { get; set; }

    [Column("notas")]
    public string? Notas { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
