import { createContext, useContext, useState, ReactNode } from 'react'

type AuthMode = 'user' | 'guest' | null

interface AuthContextType {
  authMode: AuthMode
  token: string | null
  isAuthenticated: boolean
  isGuest: boolean
  login: (token: string) => void
  loginGuest: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const storedMode = localStorage.getItem('authMode')
    const hasToken = !!localStorage.getItem('token')
    if (storedMode === 'guest') return 'guest'
    if (storedMode === 'user' && hasToken) return 'user'
    if (hasToken) return 'user'
    return null
  })

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('authMode', 'user')
    setAuthMode('user')
    setToken(newToken)
  }

  const loginGuest = () => {
    localStorage.removeItem('token')
    localStorage.setItem('authMode', 'guest')
    setToken(null)
    setAuthMode('guest')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('authMode')
    setToken(null)
    setAuthMode(null)
  }

  return (
    <AuthContext.Provider
      value={{
        authMode,
        token,
        isAuthenticated: authMode !== null,
        isGuest: authMode === 'guest',
        login,
        loginGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
