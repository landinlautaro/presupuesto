import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { format } from 'date-fns'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import type { Asignacion, Fx, ResumenMes } from '../types'

const ACTIVOS = [
  'USD (billete)',
  'USD (MEP)',
  'FCI money market',
  'Plazo fijo',
  'Bonos',
  'CEDEAR',
  'ETF',
  'Crypto (BTC)',
  'Crypto (ETH)',
  'Otros',
]

const FX_TIPOS = ['Oficial', 'MEP', 'CCL', 'Blue'] as const

interface AsignacionForm {
  fecha: string
  activo: string
  montoArs: number
  fxTipo: (typeof FX_TIPOS)[number]
  tc: number
  nota: string
}

interface AsignacionModalProps {
  mes: string
  asignacion: Asignacion | null
  fxMes: Fx | null
  onClose: () => void
  onSaved: () => void
}

function getTcByTipo(fxMes: Fx | null, fxTipo: string): number | null {
  if (!fxMes) return null
  if (fxTipo === 'Oficial') return fxMes.oficial ?? null
  if (fxTipo === 'MEP') return fxMes.mep ?? null
  if (fxTipo === 'CCL') return fxMes.ccl ?? null
  if (fxTipo === 'Blue') return fxMes.blue ?? null
  return null
}

function AsignacionModal({ mes, asignacion, fxMes, onClose, onSaved }: AsignacionModalProps) {
  const defaultFxTipo: AsignacionForm['fxTipo'] = 'MEP'
  const defaultTc = getTcByTipo(fxMes, defaultFxTipo) ?? 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AsignacionForm>({
    defaultValues: asignacion
      ? {
          fecha: asignacion.fecha,
          activo: asignacion.activo,
          montoArs: asignacion.montoArs,
          fxTipo: (asignacion.fxTipo as AsignacionForm['fxTipo']) ?? defaultFxTipo,
          tc: asignacion.tc,
          nota: asignacion.nota ?? '',
        }
      : {
          fecha: `${mes}-01`,
          activo: '',
          montoArs: 0,
          fxTipo: defaultFxTipo,
          tc: defaultTc,
          nota: '',
        },
  })

  const [submitError, setSubmitError] = useState('')
  const fxTipo = watch('fxTipo')
  const montoArs = watch('montoArs')
  const tc = watch('tc')

  const montoUsd = useMemo(() => {
    if (!Number.isFinite(montoArs) || !Number.isFinite(tc) || tc <= 0) return 0
    return montoArs / tc
  }, [montoArs, tc])

  useEffect(() => {
    if (asignacion) return
    const suggestedTc = getTcByTipo(fxMes, fxTipo)
    if (suggestedTc && suggestedTc > 0) {
      setValue('tc', suggestedTc, { shouldValidate: true })
    }
  }, [fxMes, fxTipo, setValue, asignacion])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const onSubmit = async (data: AsignacionForm) => {
    setSubmitError('')
    const payload = {
      fecha: data.fecha,
      activo: data.activo,
      montoArs: data.montoArs,
      fxTipo: data.fxTipo,
      tc: data.tc,
      nota: data.nota.trim() === '' ? null : data.nota.trim(),
    }

    try {
      if (asignacion) {
        await api.put(`/asignacion/${asignacion.id}`, payload)
      } else {
        await api.post('/asignacion', payload)
      }
      onSaved()
    } catch {
      setSubmitError('Error al guardar. Intentá de nuevo.')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-slate-900">
            {asignacion ? 'Editar asignación' : 'Nueva asignación'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input
                type="date"
                {...register('fecha', { required: 'Requerido' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {errors.fecha && <p className="text-xs text-red-600 mt-1">{errors.fecha.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Activo *</label>
              <select
                {...register('activo', { required: 'Requerido' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Seleccioná un activo</option>
                {ACTIVOS.map((activo) => (
                  <option key={activo} value={activo}>
                    {activo}
                  </option>
                ))}
              </select>
              {errors.activo && <p className="text-xs text-red-600 mt-1">{errors.activo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monto ARS *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('montoArs', {
                  valueAsNumber: true,
                  required: 'Requerido',
                  min: { value: 0.01, message: 'Debe ser mayor a 0' },
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {errors.montoArs && (
                <p className="text-xs text-red-600 mt-1">{errors.montoArs.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">FX Tipo *</label>
              <select
                {...register('fxTipo', { required: 'Requerido' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {FX_TIPOS.map((fx) => (
                  <option key={fx} value={fx}>
                    {fx}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">TC *</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                {...register('tc', {
                  valueAsNumber: true,
                  required: 'Requerido',
                  min: { value: 0.0001, message: 'Debe ser mayor a 0' },
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {errors.tc && <p className="text-xs text-red-600 mt-1">{errors.tc.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monto USD (calculado)</label>
            <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-slate-700">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }).format(montoUsd)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nota</label>
            <textarea
              rows={2}
              {...register('nota', { maxLength: 200 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Opcional"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg
                         hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const fmt = {
  fecha: (s: string) => {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  },
  ars: (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(n),
  usd: (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(n),
}

export default function AsignacionPage() {
  const { mes } = useMes()
  const [items, setItems] = useState<Asignacion[]>([])
  const [resumen, setResumen] = useState<ResumenMes | null>(null)
  const [fxMes, setFxMes] = useState<Fx | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Asignacion | null>(null)

  useEffect(() => {
    load()
  }, [mes]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true)
    setError('')

    try {
      const [asignacionRes, resumenRes] = await Promise.all([
        api.get<Asignacion[]>('/asignacion', { params: { mes } }),
        api.get<ResumenMes>(`/resumen/${mes}`),
      ])

      setItems(asignacionRes.data)
      setResumen(resumenRes.data)

      try {
        const fxRes = await api.get<Fx>(`/fx/${mes}`)
        setFxMes(fxRes.data)
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setFxMes(null)
        } else {
          throw e
        }
      }
    } catch {
      setError('No se pudo cargar la información de asignación')
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditando(null)
    setModalOpen(true)
  }

  const openEdit = (asignacion: Asignacion) => {
    setEditando(asignacion)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return
    try {
      await api.delete(`/asignacion/${id}`)
      load()
    } catch {
      alert('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Asignación</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mes} · {items.length} {items.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg
                     hover:bg-slate-700 transition-colors"
        >
          + Nueva asignación
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Ahorro disponible</p>
          <p className="text-lg font-semibold text-slate-900">{fmt.ars(resumen?.ahorroArs ?? 0)}</p>
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
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Asignado USD</p>
          <p className="text-lg font-semibold text-slate-900">{fmt.usd(resumen?.asignadoUsd ?? 0)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No hay asignaciones para {mes}</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm text-slate-900 underline hover:no-underline"
            >
              Agregar la primera
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Activo', 'Monto ARS', 'FX Tipo', 'TC', 'Monto USD', 'Nota', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide ${
                      h === 'Monto ARS' || h === 'TC' || h === 'Monto USD' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt.fecha(item.fecha)}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate" title={item.activo}>
                    {item.activo}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                    {fmt.ars(item.montoArs)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.fxTipo}</td>
                  <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">{item.tc.toFixed(4)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                    {fmt.usd(item.montoUsd)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate" title={item.nota ?? ''}>
                    {item.nota ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <AsignacionModal
          mes={mes}
          asignacion={editando}
          fxMes={fxMes}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}
