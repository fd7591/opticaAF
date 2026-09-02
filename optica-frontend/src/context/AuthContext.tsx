import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface AuthUser {
  id: string;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: 'SuperAdmin' | 'Admin' | 'Operador';
  expira: string;
  opticaId?: number | null;
  sucursalId?: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (nombreUsuario: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOperador: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'optica_token';
const USER_KEY = 'optica_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // Inject token into every request
  useEffect(() => {
    const interceptor = api.interceptors.request.use(config => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, [token]);

  // Auto-logout on 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) logout();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Check token expiry on mount
  useEffect(() => {
    if (user && new Date(user.expira) <= new Date()) logout();
  }, []);

  const login = async (nombreUsuario: string, password: string) => {
    const res = await api.post<{
      token: string;
      nombreUsuario: string;
      nombreCompleto: string;
      rol: string;
      expira: string;
      opticaId?: number | null;
      sucursalId?: number | null;
    }>('/api/auth/login', { nombreUsuario, password });

    const { token: newToken, ...rest } = res.data;
    const authUser: AuthUser = {
      id: '',
      ...rest,
      rol: rest.rol as AuthUser['rol'],
    };

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setToken(newToken);
    setUser(authUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAdmin: user?.rol === 'Admin' || user?.rol === 'SuperAdmin',
      isSuperAdmin: user?.rol === 'SuperAdmin',
      isOperador: user?.rol === 'Operador',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
