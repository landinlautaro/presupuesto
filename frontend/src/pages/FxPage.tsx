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
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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
  return `${MESES_ES[Number(mm) - 1] ?? mes} ${year}`
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

  useEffect(() => { loadFx() }, [selectedYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFx = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.get<Fx[]>('/fx')
      const byMes = new Map(data.map((item) => [item.mes, item]))
      setRows(buildYearMonths(selectedYear).map((month) => {
        const item = byMes.get(month)
        return {
          mes: month,
          oficial: toInput(item?.oficial ?? null),
          mep: toInput(item?.mep ?? null),
          ccl: toInput(item?.ccl ?? null),
          blue: toInput(item?.blue ?? null),
          notas: item?.notas ?? '',
        }
      }))
    } catch {
      setError('No se pudo cargar la tabla de tipo de cambio')
    } finally {
      setLoading(false)
    }
  }

  const setCell = (month: string, field: keyof Omit<FxRow, 'mes'>, value: string) => {
    setRows((current) => current.map((row) => (row.mes === month ? { ...row, [field]: value } : row)))
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
            ? { ...row, oficial: toInput(data.oficial), mep: toInput(data.mep), ccl: toInput(data.ccl), blue: toInput(data.blue) }
            : row
        )
      )
      if (mesActual.startsWith(`${selectedYear}-`)) {
        setSuccess(`Cotizacion cargada en ${formatMes(mesActual)}. Falta guardar la fila.`)
      } else {
        setSuccess(`Cotizacion obtenida para ${mesActual}, fuera del ano ${selectedYear}.`)
      }
    } catch {
      setError('No se pudo obtener la cotizacion actual')
    } finally {
      setLoadingCotizacion(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="win-panel p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="pixel-font text-[20px] leading-none text-[#000080]">Tipo de Cambio</p>
            <p className="mt-1">Ano {selectedYear}</p>
          </div>
          <button onClick={traerCotizacionActual} disabled={loadingCotizacion} className="win-btn">
            {loadingCotizacion ? 'Consultando...' : 'Traer cotizacion actual'}
          </button>
        </div>
      </div>

      {error && <div className="win-alert">{error}</div>}
      {success && <div className="win-success">{success}</div>}

      <div className="win-inset overflow-auto">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : (
          <table className="win-table min-w-[920px]">
            <thead>
              <tr>
                {['Mes', 'Oficial', 'MEP', 'CCL', 'Blue', 'Notas', 'Acciones'].map((h) => (
                  <th key={h} className={h === 'Mes' || h === 'Notas' ? '' : 'text-right'}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSaving = savingMes === row.mes
                return (
                  <tr key={row.mes}>
                    <td>{formatMes(row.mes)}</td>
                    <td><input value={row.oficial} onChange={(e) => setCell(row.mes, 'oficial', e.target.value)} className="win-input ml-auto w-24 text-right" /></td>
                    <td><input value={row.mep} onChange={(e) => setCell(row.mes, 'mep', e.target.value)} className="win-input ml-auto w-24 text-right" /></td>
                    <td><input value={row.ccl} onChange={(e) => setCell(row.mes, 'ccl', e.target.value)} className="win-input ml-auto w-24 text-right" /></td>
                    <td><input value={row.blue} onChange={(e) => setCell(row.mes, 'blue', e.target.value)} className="win-input ml-auto w-24 text-right" /></td>
                    <td><input value={row.notas} onChange={(e) => setCell(row.mes, 'notas', e.target.value)} className="win-input min-w-[180px]" /></td>
                    <td className="text-right"><button onClick={() => saveRow(row)} disabled={isSaving} className="win-btn">{isSaving ? 'Guardando...' : 'Guardar'}</button></td>
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
