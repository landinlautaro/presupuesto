import { createContext, useContext, useState, ReactNode } from 'react'
import { format } from 'date-fns'

interface MesContextType {
  mes: string          // formato YYYY-MM
  setMes: (mes: string) => void
  meses: string[]      // lista ordenada desc para el selector
}

const MesContext = createContext<MesContextType | null>(null)

/** Genera todos los meses del año anterior, el actual y el siguiente. */
function generarMeses(): string[] {
  const result: string[] = []
  const currentYear = new Date().getFullYear()
  for (let year = currentYear + 1; year >= currentYear - 1; year--) {
    for (let month = 12; month >= 1; month--) {
      result.push(`${year}-${String(month).padStart(2, '0')}`)
    }
  }
  return result
}

export function MesProvider({ children }: { children: ReactNode }) {
  const [mes, setMes] = useState<string>(() => format(new Date(), 'yyyy-MM'))
  const meses = generarMeses()

  return (
    <MesContext.Provider value={{ mes, setMes, meses }}>
      {children}
    </MesContext.Provider>
  )
}

export function useMes() {
  const ctx = useContext(MesContext)
  if (!ctx) throw new Error('useMes must be used within MesProvider')
  return ctx
}
