import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import { getDemoMovimientosByMes } from '../mocks/demoData'
import { alertWin98, confirmWin98 } from '../lib/win98Dialog'
import type { Movimiento } from '../types'

const CATEGORIAS: Record<string, string[]> = {
  Ingreso: ['Sueldo', 'Freelance', 'Rentas', 'Otros Ingresos'],
  Egreso: [
    'Alquiler', 'Servicios', 'Comida', 'Transporte', 'Salud',
    'Educacion', 'Deportes', 'Ocio', 'Impuestos', 'Seguros', 'Deuda', 'Otros Egresos',
  ],
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
}

interface MovimientoForm {
  fecha: string
  tipo: string
  categoria: string
  descripcion: string
  montoArs: number
  cuentaMedio: string
  tags: string
}

interface ModalProps {
  movimiento: Movimiento | null
  onClose: () => void
  onSaved: () => void
}

function MovimientoModal({ movimiento, onClose, onSaved }: ModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoForm>({
    defaultValues: movimiento
      ? {
          fecha: movimiento.fecha,
          tipo: movimiento.tipo,
          categoria: movimiento.categoria,
          descripcion: movimiento.descripcion,
          montoArs: movimiento.montoArs,
          cuentaMedio: movimiento.cuentaMedio ?? '',
          tags: movimiento.tags ?? '',
        }
      : {
          fecha: format(new Date(), 'yyyy-MM-dd'),
          tipo: 'Egreso',
          categoria: '',
          descripcion: '',
          montoArs: 0,
          cuentaMedio: '',
          tags: '',
        },
  })

  const tipoValue = watch('tipo')
  const categorias = CATEGORIAS[tipoValue] ?? []
  const prevTipo = useRef(tipoValue)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (tipoValue !== prevTipo.current) {
      setValue('categoria', '')
      prevTipo.current = tipoValue
    }
  }, [tipoValue, setValue])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const onSubmit = async (data: MovimientoForm) => {
    setSubmitError('')
    try {
      if (movimiento) {
        await api.put(`/movimientos/${movimiento.id}`, data)
      } else {
        await api.post('/movimientos', data)
      }
      onSaved()
    } catch {
      setSubmitError('Error al guardar. Intente nuevamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={onClose}>
      <div className="win-window w-full max-w-[760px]" onClick={(e) => e.stopPropagation()}>
        <div className="win-titlebar">
          <div className="win-title">
            <span className="win-title-icon" />
            <span>{movimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}</span>
          </div>
          <div className="win-controls">
            <button type="button" className="win-control-btn" onClick={onClose}>X</button>
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
              <label className="win-label">Tipo *</label>
              <select {...register('tipo', { required: 'Requerido' })} className="win-select">
                <option value="Ingreso">Ingreso</option>
                <option value="Egreso">Egreso</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="win-label">Categoria *</label>
            <select {...register('categoria', { required: 'Requerido' })} className="win-select">
              <option value="">Seleccione</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.categoria && <p className="mt-1 text-[11px] text-[#990000]">{errors.categoria.message}</p>}
          </div>

          <div className="mt-3">
            <label className="win-label">Descripcion *</label>
            <input
              type="text"
              {...register('descripcion', { required: 'Requerido' })}
              className="win-input"
              title="Ingrese una descripcion"
            />
            {errors.descripcion && <p className="mt-1 text-[11px] text-[#990000]">{errors.descripcion.message}</p>}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
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
              <label className="win-label">Cuenta / Medio</label>
              <input type="text" {...register('cuentaMedio')} className="win-input" />
            </div>
          </div>

          <div className="mt-3">
            <label className="win-label">Tags</label>
            <input type="text" {...register('tags')} className="win-input" />
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

export default function MovimientosPage() {
  const { isGuest } = useAuth()
  const { mes } = useMes()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Movimiento | null>(null)

  useEffect(() => { load() }, [mes]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = isGuest
        ? getDemoMovimientosByMes(mes)
        : (await api.get<Movimiento[]>('/movimientos', { params: { mes } })).data
      setMovimientos(data)
    } catch {
      setError('No se pudieron cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    if (isGuest) return
    setEditando(null)
    setModalOpen(true)
  }
  const openEdit = (m: Movimiento) => {
    if (isGuest) return
    setEditando(m)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (isGuest) return
    const confirmed = await confirmWin98('Desea eliminar este movimiento?', 'Eliminar')
    if (!confirmed) return
    try {
      await api.delete(`/movimientos/${id}`)
      load()
    } catch {
      await alertWin98('No se pudo eliminar el registro', 'Error')
    }
  }

  const ingresos = movimientos.filter((m) => m.tipo === 'Ingreso').reduce((s, m) => s + m.montoArs, 0)
  const egresos = movimientos.filter((m) => m.tipo === 'Egreso').reduce((s, m) => s + m.montoArs, 0)
  const ahorro = ingresos - egresos

  return (
    <div className="space-y-3">
      <div className="win-panel p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="pixel-font text-[20px] leading-none text-[#000080]">Movimientos</p>
            <p className="mt-1">{mes} | {movimientos.length} registros</p>
          </div>
          <button onClick={openNew} disabled={isGuest} className="win-btn">+ Nuevo movimiento</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="win-card"><p>Ingresos</p><p className="pixel-font text-[22px]">{fmt.ars(ingresos)}</p></div>
        <div className="win-card"><p>Egresos</p><p className="pixel-font text-[22px]">{fmt.ars(egresos)}</p></div>
        <div className="win-card"><p>Ahorro</p><p className="pixel-font text-[22px]">{fmt.ars(ahorro)}</p></div>
      </div>

      {error && <div className="win-alert">{error}</div>}

      <div className="win-inset overflow-auto">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : movimientos.length === 0 ? (
          <div className="p-8 text-center">
            <p>No hay movimientos para {mes}</p>
            {!isGuest && <button onClick={openNew} className="win-btn mt-2">Agregar el primero</button>}
          </div>
        ) : (
          <table className="win-table min-w-[860px]">
            <thead>
              <tr>
                {['Fecha', 'Tipo', 'Categoria', 'Descripcion', 'Monto ARS', 'Cuenta', 'Acciones'].map((h) => (
                  <th key={h} className={h === 'Monto ARS' ? 'text-right' : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => (
                <tr key={mov.id}>
                  <td>{fmt.fecha(mov.fecha)}</td>
                  <td>{mov.tipo}</td>
                  <td>{mov.categoria}</td>
                  <td title={mov.descripcion}>{mov.descripcion}</td>
                  <td className="text-right">{fmt.ars(mov.montoArs)}</td>
                  <td>{mov.cuentaMedio ?? '-'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(mov)} disabled={isGuest} className="win-btn">Editar</button>
                      <button onClick={() => handleDelete(mov.id)} disabled={isGuest} className="win-btn">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && !isGuest && (
        <MovimientoModal
          movimiento={editando}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}
