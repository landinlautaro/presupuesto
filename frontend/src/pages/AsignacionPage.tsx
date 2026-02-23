import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import { alertWin98, confirmWin98 } from '../lib/win98Dialog'
import type { Asignacion, Fx, ResumenMes } from '../types'

const ACTIVOS = [
  'USD (billete)', 'USD (MEP)', 'FCI money market', 'Plazo fijo', 'Bonos',
  'CEDEAR', 'ETF', 'Crypto (BTC)', 'Crypto (ETH)', 'Otros',
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
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
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
      setSubmitError('Error al guardar. Intente de nuevo.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="win-window w-full max-w-[820px]" onClick={(e) => e.stopPropagation()}>
        <div className="win-titlebar">
          <div className="win-title">
            <span className="win-title-icon" />
            <span>{asignacion ? 'Editar Asignacion' : 'Nueva Asignacion'}</span>
          </div>
          <div className="win-controls">
            <button type="button" onClick={onClose} className="win-control-btn">X</button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="win-label">Fecha *</label>
              <input type="date" {...register('fecha', { required: 'Requerido' })} className="win-input" />
              {errors.fecha && <p className="mt-1 text-[11px] text-[#990000]">{errors.fecha.message}</p>}
            </div>
            <div>
              <label className="win-label">Activo *</label>
              <select {...register('activo', { required: 'Requerido' })} className="win-select">
                <option value="">Seleccione</option>
                {ACTIVOS.map((activo) => <option key={activo} value={activo}>{activo}</option>)}
              </select>
              {errors.activo && <p className="mt-1 text-[11px] text-[#990000]">{errors.activo.message}</p>}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="win-label">Monto ARS *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('montoArs', {
                  valueAsNumber: true,
                  required: 'Requerido',
                  min: { value: 0.01, message: 'Debe ser mayor a 0' },
                })}
                className="win-input"
              />
              {errors.montoArs && <p className="mt-1 text-[11px] text-[#990000]">{errors.montoArs.message}</p>}
            </div>
            <div>
              <label className="win-label">FX Tipo *</label>
              <select {...register('fxTipo', { required: 'Requerido' })} className="win-select">
                {FX_TIPOS.map((fx) => <option key={fx} value={fx}>{fx}</option>)}
              </select>
            </div>
            <div>
              <label className="win-label">TC *</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                {...register('tc', {
                  valueAsNumber: true,
                  required: 'Requerido',
                  min: { value: 0.0001, message: 'Debe ser mayor a 0' },
                })}
                className="win-input"
              />
              {errors.tc && <p className="mt-1 text-[11px] text-[#990000]">{errors.tc.message}</p>}
            </div>
          </div>

          <div className="mt-3">
            <label className="win-label">Monto USD (calculado)</label>
            <div className="win-inset p-2">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              }).format(montoUsd)}
            </div>
          </div>

          <div className="mt-3">
            <label className="win-label">Nota</label>
            <textarea rows={2} {...register('nota', { maxLength: 200 })} className="win-textarea" />
          </div>

          {submitError && <p className="win-alert mt-3">{submitError}</p>}

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="win-btn">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="win-btn">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
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
  const [fxLoadedMes, setFxLoadedMes] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFx, setLoadingFx] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Asignacion | null>(null)

  useEffect(() => { load() }, [mes]) // eslint-disable-line react-hooks/exhaustive-deps

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
      setFxMes(null)
      setFxLoadedMes(null)
    } catch {
      setError('No se pudo cargar la informacion de asignacion')
    } finally {
      setLoading(false)
    }
  }

  const ensureFxMesLoaded = async () => {
    if (fxLoadedMes === mes || loadingFx) return
    setLoadingFx(true)
    try {
      const fxRes = await api.get<Fx>(`/fx/${mes}`)
      setFxMes(fxRes.data)
      setFxLoadedMes(mes)
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setFxMes(null)
        setFxLoadedMes(mes)
        return
      }
      throw e
    } finally {
      setLoadingFx(false)
    }
  }

  const openNew = async () => {
    setEditando(null)
    setModalOpen(true)
    try {
      await ensureFxMesLoaded()
    } catch {
      setError('No se pudo cargar FX sugerido')
    }
  }

  const openEdit = async (asignacion: Asignacion) => {
    setEditando(asignacion)
    setModalOpen(true)
    try {
      await ensureFxMesLoaded()
    } catch {
      setError('No se pudo cargar FX sugerido')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmWin98('Desea eliminar esta asignacion?', 'Eliminar')
    if (!confirmed) return
    try {
      await api.delete(`/asignacion/${id}`)
      load()
    } catch {
      await alertWin98('No se pudo eliminar el registro', 'Error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="win-panel p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="pixel-font text-[20px] leading-none text-[#000080]">Asignacion</p>
            <p className="mt-1">{mes} | {items.length} registros</p>
          </div>
          <button onClick={openNew} className="win-btn">+ Nueva asignacion</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <div className="win-card"><p>Ahorro disponible</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.ahorroArs ?? 0)}</p></div>
        <div className="win-card"><p>Asignado</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.asignadoArs ?? 0)}</p></div>
        <div className="win-card"><p>Sin asignar</p><p className="pixel-font text-[20px]">{fmt.ars(resumen?.sinAsignarArs ?? 0)}</p></div>
        <div className="win-card"><p>Asignado USD</p><p className="pixel-font text-[20px]">{fmt.usd(resumen?.asignadoUsd ?? 0)}</p></div>
      </div>

      {error && <div className="win-alert">{error}</div>}

      <div className="win-inset overflow-auto">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p>No hay asignaciones para {mes}</p>
            <button onClick={openNew} className="win-btn mt-2">Agregar la primera</button>
          </div>
        ) : (
          <table className="win-table min-w-[980px]">
            <thead>
              <tr>
                {['Fecha', 'Activo', 'Monto ARS', 'FX Tipo', 'TC', 'Monto USD', 'Nota', 'Acciones'].map((h) => (
                  <th key={h} className={h === 'Monto ARS' || h === 'TC' || h === 'Monto USD' ? 'text-right' : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{fmt.fecha(item.fecha)}</td>
                  <td title={item.activo}>{item.activo}</td>
                  <td className="text-right">{fmt.ars(item.montoArs)}</td>
                  <td>{item.fxTipo}</td>
                  <td className="text-right">{item.tc.toFixed(4)}</td>
                  <td className="text-right">{fmt.usd(item.montoUsd)}</td>
                  <td>{item.nota ?? '-'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="win-btn">Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="win-btn">Eliminar</button>
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
