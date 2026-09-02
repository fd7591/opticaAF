import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Eye, Users, GraduationCap, Upload, LayoutDashboard, Menu, X, LogOut,
  ShieldCheck, Building2, MapPin, UserCheck, ShoppingBag
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users },
  { to: '/graduaciones', label: 'Graduaciones', icon: GraduationCap },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-9 h-9 bg-primary-600 rounded-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">ÓpticaSystem</h1>
            <p className="text-xs text-gray-500 mt-0.5">Gestión de pacientes</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-2 pb-1 px-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administración</p>
              </div>

              {isSuperAdmin && (
                <NavLink
                  to="/admin/opticas"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  Ópticas
                </NavLink>
              )}

              <NavLink
                to="/admin/sucursales"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Sucursales
              </NavLink>

              <NavLink
                to="/admin/optometristas"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <UserCheck className="w-4 h-4 flex-shrink-0" />
                Optometristas
              </NavLink>

              <NavLink
                to="/admin/importar"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Upload className="w-4 h-4 flex-shrink-0" />
                Importar
              </NavLink>

              <NavLink
                to="/admin/surtir"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                Material a surtir
              </NavLink>

              <NavLink
                to="/admin/usuarios"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Usuarios
              </NavLink>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
              {user?.nombreCompleto?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.nombreCompleto}</p>
              <p className="text-xs text-gray-400 truncate">{user?.rol}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <PageTitle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageTitle() {
  const location = useLocation();
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/pacientes': 'Pacientes',
    '/graduaciones': 'Graduaciones',
    '/admin/importar': 'Importar Graduaciones',
    '/admin/usuarios': 'Administración de Usuarios',
    '/admin/opticas': 'Ópticas',
    '/admin/sucursales': 'Sucursales',
    '/admin/optometristas': 'Optometristas',
    '/admin/surtir': 'Material a Surtir',
  };
  const path = location.pathname;
  const title = Object.entries(titles).find(([k]) => path === k || (k !== '/' && path.startsWith(k)))?.[1] || '';
  return <h2 className="text-base font-semibold text-gray-800">{title}</h2>;
}
