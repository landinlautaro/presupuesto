import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMes } from '../contexts/MesContext'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',        end: true  },
  { to: '/movimientos', label: 'Movimientos',     end: false },
  { to: '/asignacion',  label: 'Asignación',      end: false },
  { to: '/fx',          label: 'Tipo de Cambio',  end: false },
  { to: '/importar',    label: 'Importar',        end: false },
]

const MESES_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-')
  return `${MESES_ES[parseInt(month) - 1]} ${year}`
}

export default function Layout() {
  const { logout } = useAuth()
  const { mes, setMes, meses } = useMes()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-700">
          <h1 className="text-white font-bold text-base tracking-wide">Presupuesto</h1>
          <p className="text-slate-400 text-xs mt-0.5">Control financiero</p>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
          >
            {meses.map((m) => (
              <option key={m} value={m}>{formatMesLabel(m)}</option>
            ))}
          </select>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
