namespace PresupuestoApi.DTOs;

/// <summary>Resumen financiero de un mes.</summary>
public record ResumenMesResponse(
    decimal IngresosArs,
    decimal EgresosArs,
    decimal AhorroArs,       // IngresosArs - EgresosArs
    decimal AsignadoArs,
    decimal SinAsignarArs,   // AhorroArs - AsignadoArs
    decimal AsignadoUsd,
    decimal TcPromedio        // Ponderado: AsignadoArs / AsignadoUsd (0 si no hay asignaciones)
);

/// <summary>Fila del resumen de activos (acumulado histórico).</summary>
public record ActivoResumenItem(
    string  Activo,
    decimal TotalArs,
    decimal TotalUsd,
    decimal Porcentaje        // % sobre el total ARS de todos los activos
);
