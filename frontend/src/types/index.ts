// ── Entidades (respuestas del backend — camelCase) ────────────────────────────

export interface Movimiento {
  id: string
  fecha: string          // 'YYYY-MM-DD' (DateOnly)
  mes: string            // 'YYYY-MM'
  tipo: string           // 'Ingreso' | 'Egreso'
  categoria: string
  descripcion: string
  montoArs: number
  cuentaMedio: string | null
  tags: string | null
  createdAt: string
}

export interface Asignacion {
  id: string
  fecha: string
  mes: string
  activo: string
  montoArs: number
  fxTipo: string         // 'Oficial' | 'MEP' | 'CCL' | 'Blue'
  tc: number
  montoUsd: number       // calculado en el backend: montoArs / tc
  nota: string | null
  createdAt: string
}

export interface Fx {
  id: string
  mes: string
  oficial: number | null
  mep: number | null
  ccl: number | null
  blue: number | null
  notas: string | null
  updatedAt: string
}

export interface ResumenMes {
  ingresosArs: number
  egresosArs: number
  ahorroArs: number
  asignadoArs: number
  sinAsignarArs: number
  asignadoUsd: number
  tcPromedio: number
}

export interface ActivoResumen {
  activo: string
  totalArs: number
  totalUsd: number
  porcentaje: number
}

export interface SerieMensualResumen {
  mes: string
  ingresosArs: number
  egresosArs: number
}

export interface DashboardResumen {
  resumen: ResumenMes
  activos: ActivoResumen[]
  serieMensual: SerieMensualResumen[]
}

export interface CotizacionActual {
  oficial: number | null
  mep: number | null
  ccl: number | null
  blue: number | null
}

export interface ImportResult {
  movimientosInsertados: number
  asignacionInsertados: number
  fxUpsertados: number
}
