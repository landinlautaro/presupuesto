import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { useMes } from '../contexts/MesContext'
import api from '../lib/api'
import type { Movimiento } from '../types'

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS: Record<string, string[]> = {
  Ingreso: ['Sueldo', 'Freelance', 'Rentas', 'Otros Ingresos'],
  Egreso: [
    'Alquiler', 'Servicios', 'Comida', 'Transporte', 'Salud',
    'Educación', 'Deportes', 'Ocio', 'Impuestos', 'Seguros', 'Deuda', 'Otros Egresos',
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Tipos del formulario ──────────────────────────────────────────────────────

interface MovimientoForm {
  fecha: string
  tipo: string
  categoria: string
  descripcion: string
  montoArs: number
  cuentaMedio: string
  tags: string
}

// ── Modal de creación / edición ───────────────────────────────────────────────

interface ModalProps {
  movimiento: Movimiento | null   // null = nuevo
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
          fecha:       movimiento.fecha,
          tipo:        movimiento.tipo,
          categoria:   movimiento.categoria,
          descripcion: movimiento.descripcion,
          montoArs:    movimiento.montoArs,
          cuentaMedio: movimiento.cuentaMedio ?? '',
          tags:        movimiento.tags ?? '',
        }
      : {
          fecha:       format(new Date(), 'yyyy-MM-dd'),
          tipo:        'Egreso',
          categoria:   '',
          descripcion: '',
          montoArs:    0,
          cuentaMedio: '',
          tags:        '',
        },
  })

  const tipoValue = watch('tipo')
  const categorias = CATEGORIAS[tipoValue] ?? []
  const prevTipo = useRef(tipoValue)

  // Limpia la categoría al cambiar el tipo
  useEffect(() => {
    if (tipoValue !== prevTipo.current) {
      setValue('categoria', '')
      prevTipo.current = tipoValue
    }
  }, [tipoValue, setValue])

  // Cerrar con Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const [submitError, setSubmitError] = useState('')

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
      setSubmitError('Error al guardar. Intentá de nuevo.')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-slate-900">
            {movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha *</label>
              <input
                type="date"
                {...register('fecha', { required: 'Requerido' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              {errors.fecha && (
                <p className="text-xs text-red-600 mt-1">{errors.fecha.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo *</label>
              <select
                {...register('tipo', { required: 'Requerido' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="Ingreso">Ingreso</option>
                <option value="Egreso">Egreso</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Categoría *</label>
            <select
              {...register('categoria', { required: 'Requerido' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Seleccioná una categoría</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-xs text-red-600 mt-1">{errors.categoria.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción *</label>
            <input
              type="text"
              placeholder="Ej: Supermercado Carrefour"
              {...register('descripcion', { required: 'Requerido' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            {errors.descripcion && (
              <p className="text-xs text-red-600 mt-1">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Monto ARS */}
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

            {/* Cuenta / Medio */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta / Medio</label>
              <input
                type="text"
                placeholder="Ej: Santander débito"
                {...register('cuentaMedio')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tags</label>
            <input
              type="text"
              placeholder="Ej: hogar, fijo, cuota"
              {...register('tags')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{submitError}</p>
          )}

          {/* Acciones */}
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

// ── MovimientosPage ───────────────────────────────────────────────────────────

export default function MovimientosPage() {
  const { mes } = useMes()
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [modalOpen, setModalOpen]     = useState(false)
  const [editando, setEditando]       = useState<Movimiento | null>(null)

  useEffect(() => { load() }, [mes])    // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<Movimiento[]>('/movimientos', { params: { mes } })
      setMovimientos(data)
    } catch {
      setError('No se pudieron cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }

  const openNew  = () => { setEditando(null); setModalOpen(true) }
  const openEdit = (m: Movimiento) => { setEditando(m); setModalOpen(true) }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    try {
      await api.delete(`/movimientos/${id}`)
      load()
    } catch {
      alert('Error al eliminar')
    }
  }

  // Totales calculados en el cliente a partir de los datos cargados
  const ingresos = movimientos
    .filter((m) => m.tipo === 'Ingreso')
    .reduce((s, m) => s + m.montoArs, 0)
  const egresos  = movimientos
    .filter((m) => m.tipo === 'Egreso')
    .reduce((s, m) => s + m.montoArs, 0)
  const ahorro   = ingresos - egresos

  return (
    <div>
      {/* ── Encabezado de página ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Movimientos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mes} · {movimientos.length} {movimientos.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg
                     hover:bg-slate-700 transition-colors"
        >
          + Nuevo movimiento
        </button>
      </div>

      {/* ── Cards de resumen ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Ingresos</p>
          <p className="text-lg font-semibold text-emerald-600">{fmt.ars(ingresos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Egresos</p>
          <p className="text-lg font-semibold text-red-500">{fmt.ars(egresos)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-slate-500 mb-1">Ahorro</p>
          <p className={`text-lg font-semibold ${ahorro >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
            {fmt.ars(ahorro)}
          </p>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Cargando…</div>
        ) : movimientos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">No hay movimientos para {mes}</p>
            <button
              onClick={openNew}
              className="mt-3 text-sm text-slate-900 underline hover:no-underline"
            >
              Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto ARS', 'Cuenta', ''].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide
                                ${h === 'Monto ARS' ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {fmt.fecha(mov.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        mov.tipo === 'Ingreso'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{mov.categoria}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={mov.descripcion}>
                    {mov.descripcion}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                    {fmt.ars(mov.montoArs)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">
                    {mov.cuentaMedio ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(mov)}
                        className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(mov.id)}
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

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <MovimientoModal
          movimiento={editando}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}
