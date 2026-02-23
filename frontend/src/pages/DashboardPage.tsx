import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import { getDemoDashboard } from '../mocks/demoData'
import type { ActivoResumen, DashboardResumen, ResumenMes } from '../types'

interface SerieMensualItem {
  mes: string
  label: string
  ingresosArs: number
  egresosArs: number
}

const MESES_ES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const PIE_COLORS = ['#000080', '#004bb5', '#0078d7', '#2b5797', '#7f7f7f', '#4a4a4a']

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
  const { isGuest } = useAuth()
  const { mes } = useMes()
  const selectedYear = useMemo(() => mes.split('-')[0], [mes])
  const [resumen, setResumen] = useState<ResumenMes | null>(null)
  const [activos, setActivos] = useState<ActivoResumen[]>([])
  const [serieMensual, setSerieMensual] = useState<SerieMensualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadDashboard() }, [mes, selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const months = buildYearMonths(selectedYear)
      const data = isGuest
        ? getDemoDashboard(mes)
        : (await api.get<DashboardResumen>(`/resumen/dashboard/${mes}`)).data
      const serieByMes = new Map(data.serieMensual.map((item) => [item.mes, item]))
      setResumen(data.resumen)
      setActivos(data.activos)
      setSerieMensual(
        months.map((month, index) => ({
          mes: month,
          label: MESES_ES_CORTO[index],
          ingresosArs: serieByMes.get(month)?.ingresosArs ?? 0,
          egresosArs: serieByMes.get(month)?.egresosArs ?? 0,
        }))
      )
    } catch {
      setError('No se pudo cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="win-panel p-2">
        <p className="pixel-font text-[20px] leading-none text-[#000080]">Dashboard</p>
        <p className="mt-1">Mes seleccionado: {mes} | Ano del analisis: {selectedYear}</p>
      </div>

      {error && <div className="win-alert">{error}</div>}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        <div className="win-card"><p>Ingresos</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.ingresosArs ?? 0)}</p></div>
        <div className="win-card"><p>Egresos</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.egresosArs ?? 0)}</p></div>
        <div className="win-card"><p>Ahorro</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.ahorroArs ?? 0)}</p></div>
        <div className="win-card"><p>Asignado</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.asignadoArs ?? 0)}</p></div>
        <div className="win-card"><p>Sin asignar</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.sinAsignarArs ?? 0)}</p></div>
      </div>

      {loading ? (
        <div className="win-panel p-8 text-center">Cargando dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="win-panel p-2">
            <p className="pixel-font text-[18px] leading-none">Ingresos vs Egresos ({selectedYear})</p>
            <div className="mt-2 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieMensual}>
                  <CartesianGrid stroke="#9e9e9e" strokeDasharray="2 2" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => Intl.NumberFormat('es-AR').format(value)} />
                  <Tooltip formatter={(value: number) => fmt.ars(value)} />
                  <Bar dataKey="ingresosArs" name="Ingresos" fill="#0078d7" />
                  <Bar dataKey="egresosArs" name="Egresos" fill="#000080" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="win-panel p-2">
            <p className="pixel-font text-[18px] leading-none">Distribucion de activos</p>
            <p className="mt-1">Acumulado historico de asignaciones</p>
            {activos.length === 0 ? (
              <div className="mt-2 h-[320px] grid place-items-center">Sin asignaciones para graficar</div>
            ) : (
              <div className="mt-2 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activos} dataKey="totalArs" nameKey="activo" cx="50%" cy="50%" outerRadius={110}>
                      {activos.map((item, index) => (
                        <Cell key={`${item.activo}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item) => {
                        const payload = item.payload as ActivoResumen
                        return [`${fmt.ars(value)} | ${fmt.usd(payload.totalUsd)}`, payload.activo]
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
