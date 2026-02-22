using Microsoft.EntityFrameworkCore;
using PresupuestoApi.Models;

namespace PresupuestoApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Movimiento> Movimientos { get; set; }
    public DbSet<Asignacion> Asignaciones { get; set; }
    public DbSet<Fx> Fx { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Fx: mes debe ser único por mes
        modelBuilder.Entity<Fx>()
            .HasIndex(f => f.Mes)
            .IsUnique();

        // Default timestamps via SQL (para registros insertados fuera de EF)
        modelBuilder.Entity<Movimiento>()
            .Property(m => m.CreatedAt)
            .HasDefaultValueSql("now()");

        modelBuilder.Entity<Asignacion>()
            .Property(a => a.CreatedAt)
            .HasDefaultValueSql("now()");

        modelBuilder.Entity<Fx>()
            .Property(f => f.UpdatedAt)
            .HasDefaultValueSql("now()");
    }
}
