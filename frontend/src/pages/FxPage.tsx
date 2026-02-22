import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import type { CotizacionActual, Fx } from '../types'

interface FxRow {
  mes: string
  oficial: string
  mep: string
  ccl: string
  blue: string
  notas: string
}

const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function toInput(value: number | null): string {
  return value == null ? '' : value.toString()
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatMes(mes: string): string {
  const [year, mm] = mes.split('-')
  const monthNumber = Number(mm)
  const monthLabel = MESES_ES[monthNumber - 1] ?? mes
  return `${monthLabel} ${year}`
}

function buildYearMonths(year: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export default function FxPage() {
  const { mes } = useMes()
  const selectedYear = useMemo(() => mes.split('-')[0], [mes])

  const [rows, setRows] = useState<FxRow[]>([])
  const [loading, setLoading] = useState(false)
  const [savingMes, setSavingMes] = useState<string | null>(null)
  const [loadingCotizacion, setLoadingCotizacion] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadFx()
  }, [selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFx = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.get<Fx[]>('/fx')
      const byMes = new Map(data.map((item) => [item.mes, item]))
      const yearMonths = buildYearMonths(selectedYear)

      const nextRows = yearMonths.map((month) => {
        const item = byMes.get(month)
        return {
          mes: month,
          oficial: toInput(item?.oficial ?? null),
          mep: toInput(item?.mep ?? null),
          ccl: toInput(item?.ccl ?? null),
          blue: toInput(item?.blue ?? null),
          notas: item?.notas ?? '',
        }
      })

      setRows(nextRows)
    } catch {
      setError('No se pudo cargar la tabla de tipo de cambio')
    } finally {
      setLoading(false)
    }
  }

  const setCell = (month: string, field: keyof Omit<FxRow, 'mes'>, value: string) => {
    setRows((current) =>
      current.map((row) => (row.mes === month ? { ...row, [field]: value } : row))
    )
  }

  const saveRow = async (row: FxRow) => {
    setSavingMes(row.mes)
    setError('')
    setSuccess('')

    const payload = {
      oficial: toNullableNumber(row.oficial),
      mep: toNullableNumber(row.mep),
      ccl: toNullableNumber(row.ccl),
      blue: toNullableNumber(row.blue),
      notas: row.notas.trim() === '' ? null : row.notas.trim(),
    }

    try {
      await api.put(`/fx/${row.mes}`, payload)
      setSuccess(`Guardado ${formatMes(row.mes)}`)
      await loadFx()
    } catch {
      setError(`No se pudo guardar ${formatMes(row.mes)}`)
    } finally {
      setSavingMes(null)
    }
  }

  const traerCotizacionActual = async () => {
    setLoadingCotizacion(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.get<CotizacionActual>('/fx/cotizacion-actual')
      const mesActual = format(new Date(), 'yyyy-MM')

      setRows((current) =>
        current.map((row) =>
          row.mes === mesActual
            ? {
                ...row,
                oficial: toInput(data.oficial),
                mep: toInput(data.mep),
                ccl: toInput(data.ccl),
                blue: toInput(data.blue),
              }
            : row
        )
      )

      if (mesActual.startsWith(`${selectedYear}-`)) {
        setSuccess(`Cotización cargada en ${formatMes(mesActual)}. Falta guardar la fila.`)
      } else {
        setSuccess(
          `Cotización obtenida para ${mesActual}, pero esa fila no está visible en el año ${selectedYear}.`
        )
      }
    } catch {
      setError('No se pudo obtener la cotización actual')
    } finally {
      setLoadingCotizacion(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tipo de cambio</h1>
          <p className="text-slate-500 text-sm mt-0.5">Año {selectedYear}</p>
        </div>
        <button
          onClick={traerCotizacionActual}
          disabled={loadingCotizacion}
          className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg
                     hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {loadingCotizacion ? 'Consultando…' : 'Traer cotización actual'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Cargando…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Mes', 'Oficial', 'MEP', 'CCL', 'Blue', 'Notas', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide ${
                      h === 'Mes' || h === 'Notas' ? 'text-left' : 'text-right'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const isSaving = savingMes === row.mes
                return (
                  <tr key={row.mes} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatMes(row.mes)}</td>

                    <td className="px-4 py-2">
                      <input
                        value={row.oficial}
                        onChange={(e) => setCell(row.mes, 'oficial', e.target.value)}
                        placeholder="-"
                        className="w-24 ml-auto block border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right
                                   focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <input
                        value={row.mep}
                        onChange={(e) => setCell(row.mes, 'mep', e.target.value)}
                        placeholder="-"
                        className="w-24 ml-auto block border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right
                                   focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <input
                        value={row.ccl}
                        onChange={(e) => setCell(row.mes, 'ccl', e.target.value)}
                        placeholder="-"
                        className="w-24 ml-auto block border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right
                                   focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <input
                        value={row.blue}
                        onChange={(e) => setCell(row.mes, 'blue', e.target.value)}
                        placeholder="-"
                        className="w-24 ml-auto block border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right
                                   focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <input
                        value={row.notas}
                        onChange={(e) => setCell(row.mes, 'notas', e.target.value)}
                        placeholder="Opcional"
                        className="w-full min-w-[180px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                    </td>

                    <td className="px-4 py-2">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={isSaving}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 text-white
                                   hover:bg-slate-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {isSaving ? 'Guardando…' : 'Guardar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
