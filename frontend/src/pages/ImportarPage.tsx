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
    return { name: file.name, sizeMb: (file.size / (1024 * 1024)).toFixed(2) }
  }, [file])

  const setFileSafely = (next: File | null) => {
    setError('')
    setSuccess('')
    setResult(null)
    if (!next) return setFile(null)
    if (!isXlsxFile(next)) return setError('El archivo debe tener extension .xlsx')
    if (next.size > MAX_SIZE_BYTES) return setError(`El archivo no puede superar ${MAX_SIZE_MB} MB`)
    setFile(next)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setFileSafely(e.dataTransfer.files?.[0] ?? null)
  }

  const handleImport = async () => {
    if (!file) {
      setError('Seleccione un archivo .xlsx para importar')
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
      setSuccess('Importacion completada correctamente')
    } catch {
      setError('No se pudo importar el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="win-panel p-2">
        <p className="pixel-font text-[20px] leading-none text-[#000080]">Importar</p>
        <p className="mt-1">Suba un archivo .xlsx con hojas Movimientos, Asignacion y/o FX.</p>
      </div>

      <div className="win-panel p-3">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onDrop={handleDrop}
          className={`p-6 text-center ${isDragging ? 'win-inset bg-[#e8f1ff]' : 'win-inset'}`}
        >
          <p>Arrastre su archivo .xlsx aqui</p>
          <p className="mt-1 text-[11px]">o seleccione uno desde su computadora (max {MAX_SIZE_MB} MB)</p>
          <label className="mt-3 inline-block">
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => setFileSafely(e.target.files?.[0] ?? null)} />
            <span className="win-btn cursor-pointer">Seleccionar archivo</span>
          </label>

          {fileInfo && (
            <div className="win-panel mx-auto mt-3 inline-flex items-center gap-2 px-2 py-1">
              <span title={fileInfo.name}>{fileInfo.name}</span>
              <span>({fileInfo.sizeMb} MB)</span>
              <button onClick={() => setFileSafely(null)} className="win-btn">Quitar</button>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={handleImport} disabled={loading || !file} className="win-btn">
            {loading ? 'Importando...' : 'Importar'}
          </button>
          <span>El backend ignora hojas inexistentes y filas vacias/malformadas.</span>
        </div>
      </div>

      {error && <div className="win-alert">{error}</div>}
      {success && <div className="win-success">{success}</div>}

      {result && (
        <div className="win-panel p-3">
          <p className="pixel-font text-[18px] leading-none">Resultado de importacion</p>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="win-card"><p>Movimientos insertados</p><p className="pixel-font text-[22px]">{result.movimientosInsertados}</p></div>
            <div className="win-card"><p>Asignaciones insertadas</p><p className="pixel-font text-[22px]">{result.asignacionInsertados}</p></div>
            <div className="win-card"><p>FX upsertados</p><p className="pixel-font text-[22px]">{result.fxUpsertados}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
