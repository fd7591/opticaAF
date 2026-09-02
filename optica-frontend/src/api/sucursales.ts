import api from './client';
import type { Sucursal } from '../types';

interface SucursalCreateForm {
  opticaId: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

interface SucursalUpdateForm {
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export const sucursalesApi = {
  getAll: (opticaId?: number) =>
    api.get<Sucursal[]>('/api/sucursales', { params: opticaId ? { opticaId } : {} }).then(r => r.data),
  getById: (id: number) => api.get<Sucursal>(`/api/sucursales/${id}`).then(r => r.data),
  create: (data: SucursalCreateForm) => api.post<Sucursal>('/api/sucursales', data).then(r => r.data),
  update: (id: number, data: SucursalUpdateForm) =>
    api.put<Sucursal>(`/api/sucursales/${id}`, data).then(r => r.data),
  toggle: (id: number) => api.patch(`/api/sucursales/${id}/toggle`),
};
