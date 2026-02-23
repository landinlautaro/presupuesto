import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMes } from '../contexts/MesContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/movimientos', label: 'Movimientos', end: false },
  { to: '/asignacion', label: 'Asignacion', end: false },
  { to: '/fx', label: 'Tipo de Cambio', end: false },
  { to: '/importar', label: 'Importar', end: false },
]

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-')
  return `${MESES_ES[parseInt(month, 10) - 1]} ${year}`
}

export default function Layout() {
  const { logout, isGuest } = useAuth()
  const { mes, setMes, meses } = useMes()
  const navigate = useNavigate()
  const location = useLocation()

  const activeLabel = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )?.label ?? 'Presupuesto'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="desktop-grid min-h-screen p-2 md:p-4">
      <div className="win-window mx-auto flex min-h-[95vh] max-w-[1400px] flex-col">
        <div className="win-titlebar">
          <div className="win-title">
            <span className="win-title-icon" />
            <span className="pixel-font text-[18px] leading-none">Presupuesto.exe</span>
          </div>
          <div className="win-controls">
            <button className="win-control-btn" type="button" aria-label="Minimizar">_</button>
            <button className="win-control-btn" type="button" aria-label="Maximizar">[]</button>
            <button className="win-control-btn" type="button" aria-label="Cerrar">X</button>
          </div>
        </div>

        <div className="win-menubar">
          <button type="button" className="win-menuitem">File</button>
          <button type="button" className="win-menuitem">Edit</button>
          <button type="button" className="win-menuitem">View</button>
          <button type="button" className="win-menuitem">Help</button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 md:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="win-panel flex min-h-[220px] flex-col p-2">
            <div className="win-inset mb-2 p-2">
              <p className="pixel-font text-[18px] leading-none">Navegacion</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `win-btn text-left ${isActive ? 'is-active' : ''}`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <section className="win-panel flex min-h-0 flex-col">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#808080] p-2">
              <div>
                <p className="pixel-font text-[18px] leading-none text-[#000080]">{activeLabel}</p>
                <p className="mt-1 text-[12px]">Sistema de control financiero</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <label className="win-label mb-1">Mes Activo</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="win-select min-w-[180px]"
                  >
                    {meses.map((m) => (
                      <option key={m} value={m}>{formatMesLabel(m)}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleLogout} type="button" className="win-btn">
                  {isGuest ? 'Salir de demo' : 'Cerrar sesion'}
                </button>
              </div>
            </div>

            <main className="min-h-0 flex-1 overflow-auto p-2 md:p-3">
              {isGuest && (
                <div className="win-alert mb-2">
                  Modo invitado: datos de demostracion en solo lectura.
                </div>
              )}
              <Outlet />
            </main>
          </section>
        </div>

        <div className="win-statusbar">
          <div className="win-statuscell">Listo</div>
          <div className="win-statuscell">{mes}</div>
        </div>
      </div>
    </div>
  )
}
