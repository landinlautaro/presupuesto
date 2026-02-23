import type {
  ActivoResumen,
  Asignacion,
  DashboardResumen,
  Fx,
  Movimiento,
  ResumenMes,
  SerieMensualResumen,
} from '../types'

const DEMO_MOVIMIENTOS: Movimiento[] = [
  {
    id: 'mov-1',
    fecha: '2026-01-05',
    mes: '2026-01',
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    descripcion: 'Sueldo enero',
    montoArs: 2500000,
    cuentaMedio: 'Banco',
    tags: 'salario',
    createdAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'mov-2',
    fecha: '2026-01-08',
    mes: '2026-01',
    tipo: 'Egreso',
    categoria: 'Alquiler',
    descripcion: 'Departamento',
    montoArs: 650000,
    cuentaMedio: 'Transferencia',
    tags: null,
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 'mov-3',
    fecha: '2026-01-16',
    mes: '2026-01',
    tipo: 'Egreso',
    categoria: 'Comida',
    descripcion: 'Supermercado',
    montoArs: 210000,
    cuentaMedio: 'Tarjeta',
    tags: null,
    createdAt: '2026-01-16T10:00:00Z',
  },
  {
    id: 'mov-4',
    fecha: '2026-02-05',
    mes: '2026-02',
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    descripcion: 'Sueldo febrero',
    montoArs: 2700000,
    cuentaMedio: 'Banco',
    tags: 'salario',
    createdAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'mov-5',
    fecha: '2026-02-09',
    mes: '2026-02',
    tipo: 'Egreso',
    categoria: 'Servicios',
    descripcion: 'Luz, agua e internet',
    montoArs: 185000,
    cuentaMedio: 'Debito',
    tags: null,
    createdAt: '2026-02-09T10:00:00Z',
  },
  {
    id: 'mov-6',
    fecha: '2026-02-20',
    mes: '2026-02',
    tipo: 'Egreso',
    categoria: 'Transporte',
    descripcion: 'Combustible y peajes',
    montoArs: 140000,
    cuentaMedio: 'Tarjeta',
    tags: null,
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'mov-7',
    fecha: '2026-03-05',
    mes: '2026-03',
    tipo: 'Ingreso',
    categoria: 'Freelance',
    descripcion: 'Proyecto puntual',
    montoArs: 780000,
    cuentaMedio: 'Transferencia',
    tags: 'extra',
    createdAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'mov-8',
    fecha: '2026-03-14',
    mes: '2026-03',
    tipo: 'Egreso',
    categoria: 'Ocio',
    descripcion: 'Vacaciones cortas',
    montoArs: 360000,
    cuentaMedio: 'Tarjeta',
    tags: null,
    createdAt: '2026-03-14T10:00:00Z',
  },
]

const DEMO_FX: Fx[] = [
  { id: 'fx-1', mes: '2026-01', oficial: 1120, mep: 1185, ccl: 1210, blue: 1235, notas: 'Mercado estable', updatedAt: '2026-01-31T12:00:00Z' },
  { id: 'fx-2', mes: '2026-02', oficial: 1145, mep: 1208, ccl: 1231, blue: 1260, notas: 'Suba moderada', updatedAt: '2026-02-28T12:00:00Z' },
  { id: 'fx-3', mes: '2026-03', oficial: 1170, mep: 1240, ccl: 1268, blue: 1295, notas: 'Mayor volatilidad', updatedAt: '2026-03-31T12:00:00Z' },
]

const DEMO_ASIGNACIONES: Asignacion[] = [
  {
    id: 'asg-1',
    fecha: '2026-01-25',
    mes: '2026-01',
    activo: 'USD (MEP)',
    montoArs: 500000,
    fxTipo: 'MEP',
    tc: 1185,
    montoUsd: 500000 / 1185,
    nota: 'Cobertura',
    createdAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'asg-2',
    fecha: '2026-02-25',
    mes: '2026-02',
    activo: 'FCI money market',
    montoArs: 700000,
    fxTipo: 'Oficial',
    tc: 1145,
    montoUsd: 700000 / 1145,
    nota: 'Liquidez',
    createdAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'asg-3',
    fecha: '2026-03-20',
    mes: '2026-03',
    activo: 'CEDEAR',
    montoArs: 300000,
    fxTipo: 'CCL',
    tc: 1268,
    montoUsd: 300000 / 1268,
    nota: null,
    createdAt: '2026-03-20T10:00:00Z',
  },
]

function sumByTipo(items: Movimiento[], tipo: string): number {
  return items.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + m.montoArs, 0)
}

export function getDemoMovimientosByMes(mes: string): Movimiento[] {
  return DEMO_MOVIMIENTOS.filter((m) => m.mes === mes)
}

export function getDemoAsignacionesByMes(mes: string): Asignacion[] {
  return DEMO_ASIGNACIONES.filter((a) => a.mes === mes)
}

export function getDemoFxAll(): Fx[] {
  return DEMO_FX
}

export function getDemoFxByMes(mes: string): Fx | null {
  return DEMO_FX.find((fx) => fx.mes === mes) ?? null
}

export function getDemoResumenMes(mes: string): ResumenMes {
  const movimientosMes = getDemoMovimientosByMes(mes)
  const asignacionesMes = getDemoAsignacionesByMes(mes)
  const ingresosArs = sumByTipo(movimientosMes, 'Ingreso')
  const egresosArs = sumByTipo(movimientosMes, 'Egreso')
  const ahorroArs = ingresosArs - egresosArs
  const asignadoArs = asignacionesMes.reduce((acc, item) => acc + item.montoArs, 0)
  const asignadoUsd = asignacionesMes.reduce((acc, item) => acc + item.montoUsd, 0)
  const sinAsignarArs = ahorroArs - asignadoArs
  const tcPromedio = asignadoUsd > 0 ? asignadoArs / asignadoUsd : 0
  return { ingresosArs, egresosArs, ahorroArs, asignadoArs, sinAsignarArs, asignadoUsd, tcPromedio }
}

function getDemoActivosResumen(): ActivoResumen[] {
  const grouped = new Map<string, { totalArs: number; totalUsd: number }>()
  for (const item of DEMO_ASIGNACIONES) {
    const current = grouped.get(item.activo) ?? { totalArs: 0, totalUsd: 0 }
    current.totalArs += item.montoArs
    current.totalUsd += item.montoUsd
    grouped.set(item.activo, current)
  }
  const totalArs = Array.from(grouped.values()).reduce((acc, row) => acc + row.totalArs, 0)
  return Array.from(grouped.entries()).map(([activo, row]) => ({
    activo,
    totalArs: row.totalArs,
    totalUsd: row.totalUsd,
    porcentaje: totalArs > 0 ? (row.totalArs * 100) / totalArs : 0,
  }))
}

function getDemoSerieMensual(year: string): SerieMensualResumen[] {
  return Array.from({ length: 12 }, (_, i) => {
    const mes = `${year}-${String(i + 1).padStart(2, '0')}`
    const movimientosMes = getDemoMovimientosByMes(mes)
    return {
      mes,
      ingresosArs: sumByTipo(movimientosMes, 'Ingreso'),
      egresosArs: sumByTipo(movimientosMes, 'Egreso'),
    }
  })
}

export function getDemoDashboard(mes: string): DashboardResumen {
  const year = mes.split('-')[0]
  return {
    resumen: getDemoResumenMes(mes),
    activos: getDemoActivosResumen(),
    serieMensual: getDemoSerieMensual(year),
  }
}
