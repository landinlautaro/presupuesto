import { DragEvent, useMemo, useState } from 'react'
import api from '../lib/api'
import type { ImportResult } from '../types'

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx')
}

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const fileInfo = useMemo(() => {
    if (!file) return null
    return {
      name: file.name,
      sizeMb: (file.size / (1024 * 1024)).toFixed(2),
    }
  }, [file])

  const setFileSafely = (next: File | null) => {
    setError('')
    setSuccess('')
    setResult(null)

    if (!next) {
      setFile(null)
      return
    }

    if (!isXlsxFile(next)) {
      setError('El archivo debe tener extensión .xlsx')
      return
    }

    if (next.size > MAX_SIZE_BYTES) {
      setError(`El archivo no puede superar ${MAX_SIZE_MB} MB`)
      return
    }

    setFile(next)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0] ?? null
    setFileSafely(dropped)
  }

  const handleImport = async () => {
    if (!file) {
      setError('Seleccioná un archivo .xlsx para importar')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post<ImportResult>('/import/xlsx', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      setSuccess('Importación completada correctamente')
    } catch {
      setError('No se pudo importar el archivo. Verificá el formato y volvé a intentar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">Importar</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Subí un archivo .xlsx con hojas Movimientos, Asignacion y/o FX.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging ? 'border-slate-500 bg-slate-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <p className="text-sm text-slate-700 font-medium">Arrastrá tu archivo .xlsx aquí</p>
          <p className="text-xs text-slate-500 mt-1">o seleccioná uno desde tu computadora (máx {MAX_SIZE_MB} MB)</p>

          <label className="inline-flex mt-4">
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFileSafely(e.target.files?.[0] ?? null)}
            />
            <span
              className="cursor-pointer bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg
                         hover:bg-slate-700 transition-colors"
            >
              Seleccionar archivo
            </span>
          </label>

          {fileInfo && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
              <span className="text-xs text-slate-700">{fileInfo.name}</span>
              <span className="text-xs text-slate-400">({fileInfo.sizeMb} MB)</span>
              <button
                onClick={() => setFileSafely(null)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={loading || !file}
            className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg
                       hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Importando...' : 'Importar'}
          </button>
          <span className="text-xs text-slate-500">
            El backend ignora hojas inexistentes y filas vacías/malformadas.
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {result && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Resultado de importación</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Movimientos insertados</p>
              <p className="text-2xl font-semibold text-slate-900">{result.movimientosInsertados}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Asignaciones insertadas</p>
              <p className="text-2xl font-semibold text-slate-900">{result.asignacionInsertados}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-slate-500 mb-1">FX upsertados</p>
              <p className="text-2xl font-semibold text-slate-900">{result.fxUpsertados}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
