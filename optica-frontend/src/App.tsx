import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PacientesPage from './pages/Pacientes/PacientesPage';
import PacienteDetailPage from './pages/Pacientes/PacienteDetailPage';
import GraduacionesPage from './pages/Graduaciones/GraduacionesPage';
import ImportPage from './pages/Import/ImportPage';
import UsuariosPage from './pages/Admin/UsuariosPage';
import OpticasPage from './pages/Admin/OpticasPage';
import SucursalesPage from './pages/Admin/SucursalesPage';
import OptometristasPage from './pages/Admin/OptometristasPage';
import SurtirPage from './pages/Admin/SurtirPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="pacientes" element={<PacientesPage />} />
              <Route path="pacientes/:id" element={<PacienteDetailPage />} />
              <Route path="graduaciones" element={<GraduacionesPage />} />
              <Route
                path="admin/importar"
                element={
                  <ProtectedRoute requireAdmin>
                    <ImportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/opticas"
                element={
                  <ProtectedRoute requireSuperAdmin>
                    <OpticasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/sucursales"
                element={
                  <ProtectedRoute requireAdmin>
                    <SucursalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/optometristas"
                element={
                  <ProtectedRoute requireAdmin>
                    <OptometristasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/usuarios"
                element={
                  <ProtectedRoute requireAdmin>
                    <UsuariosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/surtir"
                element={
                  <ProtectedRoute requireAdmin>
                    <SurtirPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
