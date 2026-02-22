import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import type { ActivoResumen, ResumenMes } from '../types'

interface SerieMensualItem {
  mes: string
  label: string
  ingresosArs: number
  egresosArs: number
}

const MESES_ES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const PIE_COLORS = ['#0f766e', '#1d4ed8', '#7c3aed', '#ea580c', '#b91c1c', '#4d7c0f', '#0f766e', '#9333ea']

const fmt = {
  ars: (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
  usd: (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(n),
}

function buildYearMonths(year: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export default function DashboardPage() {
  const { mes } = useMes()
  const selectedYear = useMemo(() => mes.split('-')[0], [mes])

  const [resumen, setResumen] = useState<ResumenMes | null>(null)
  const [activos, setActivos] = useState<ActivoResumen[]>([])
  const [serieMensual, setSerieMensual] = useState<SerieMensualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [mes, selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const months = buildYearMonths(selectedYear)

      const [resumenMes, activosData, resumenesAnuales] = await Promise.all([
        api.get<ResumenMes>(`/resumen/${mes}`),
        api.get<ActivoResumen[]>('/resumen/activos'),
        Promise.all(
          months.map(async (month) => {
            try {
              const { data } = await api.get<ResumenMes>(`/resumen/${month}`)
              return data
            } catch {
              return {
                ingresosArs: 0,
                egresosArs: 0,
                ahorroArs: 0,
                asignadoArs: 0,
                sinAsignarArs: 0,
                asignadoUsd: 0,
                tcPromedio: 0,
              } as ResumenMes
            }
          })
        ),
      ])

      setResumen(resumenMes.data)
      setActivos(activosData.data)
      setSerieMensual(
        resumenesAnuales.map((item, index) => ({
          mes: months[index],
          label: MESES_ES_CORTO[index],
          ingresosArs: item.ingresosArs,
          egresosArs: item.egresosArs,
        }))
      )
    } catch {
      setError('No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Mes seleccionado: {mes} · Ano del analisis: {selectedYear}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Ingresos</p>
          <p className="text-lg font-semibold text-emerald-600">{fmt.ars(resumen?.ingresosArs ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Egresos</p>
          <p className="text-lg font-semibold text-red-500">{fmt.ars(resumen?.egresosArs ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Ahorro</p>
          <p className={`text-lg font-semibold ${(resumen?.ahorroArs ?? 0) >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
            {fmt.ars(resumen?.ahorroArs ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Asignado</p>
          <p className="text-lg font-semibold text-slate-900">{fmt.ars(resumen?.asignadoArs ?? 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Sin asignar</p>
          <p
            className={`text-lg font-semibold ${
              (resumen?.sinAsignarArs ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {fmt.ars(resumen?.sinAsignarArs ?? 0)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Cargando dashboard...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Ingresos vs Egresos por mes ({selectedYear})</h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieMensual}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => Intl.NumberFormat('es-AR').format(value)} />
                  <Tooltip formatter={(value: number) => fmt.ars(value)} />
                  <Legend />
                  <Bar dataKey="ingresosArs" name="Ingresos" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresosArs" name="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">Distribucion de activos</h2>
            <p className="text-xs text-slate-500 mb-3">Acumulado historico de asignaciones</p>

            {activos.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-slate-400 text-sm">
                Sin asignaciones para graficar
              </div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activos}
                      dataKey="totalArs"
                      nameKey="activo"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {activos.map((item, index) => (
                        <Cell key={`${item.activo}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item) => {
                        const payload = item.payload as ActivoResumen
                        return [`${fmt.ars(value)} · ${fmt.usd(payload.totalUsd)}`, payload.activo]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
