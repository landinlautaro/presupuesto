import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { MesProvider } from './contexts/MesContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MovimientosPage from './pages/MovimientosPage'
import AsignacionPage from './pages/AsignacionPage'
import FxPage from './pages/FxPage'
import ImportarPage from './pages/ImportarPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MesProvider>
          <Routes>
            {/* Pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protegidas: pasan por ProtectedRoute → Layout → página */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="movimientos" element={<MovimientosPage />} />
                <Route path="asignacion" element={<AsignacionPage />} />
                <Route path="fx" element={<FxPage />} />
                <Route path="importar" element={<ImportarPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
