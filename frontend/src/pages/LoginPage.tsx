import { useState, FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../lib/api'

export default function LoginPage() {
  const { isAuthenticated, login, loginGuest } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{ token: string }>('/auth/login', { email, password })
      login(data.token)
      navigate('/')
    } catch {
      setError('Email o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    loginGuest()
    navigate('/')
  }

  return (
    <div className="desktop-grid flex min-h-screen items-center justify-center p-3">
      <div className="win-window w-full max-w-[420px]">
        <div className="win-titlebar">
          <div className="win-title">
            <span className="win-title-icon" />
            <span>Login</span>
          </div>
          <div className="win-controls">
            <button className="win-control-btn" type="button" aria-label="Cerrar">X</button>
          </div>
        </div>

        <div className="p-3">
          <div className="win-panel p-3">
            <h1 className="pixel-font text-[22px] leading-none">Presupuesto 98</h1>
            <p className="mt-1 text-[12px]">Ingrese sus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="win-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="win-input"
              />
            </div>

            <div>
              <label className="win-label">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="win-input"
              />
            </div>

            {error && <p className="win-alert">{error}</p>}

            <div className="flex justify-end">
              <button type="button" onClick={handleGuestLogin} disabled={loading} className="win-btn mr-2">
                Entrar como invitado
              </button>
              <button type="submit" disabled={loading} className="win-btn min-w-[120px]">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>

        <div className="win-statusbar">
          <div className="win-statuscell">Autenticacion requerida</div>
          <div className="win-statuscell">v1.0</div>
        </div>
      </div>
    </div>
  )
}
