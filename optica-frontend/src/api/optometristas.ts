import api from './client';
import type { Optometrista } from '../types';

interface OptometristaCreateForm {
  sucursalId: number;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  email?: string;
}

interface OptometristaUpdateForm {
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  email?: string;
}

export const optometristasApi = {
  getAll: (sucursalId?: number) =>
    api.get<Optometrista[]>('/api/optometristas', { params: sucursalId ? { sucursalId } : {} }).then(r => r.data),
  getById: (id: number) => api.get<Optometrista>(`/api/optometristas/${id}`).then(r => r.data),
  create: (data: OptometristaCreateForm) =>
    api.post<Optometrista>('/api/optometristas', data).then(r => r.data),
  update: (id: number, data: OptometristaUpdateForm) =>
    api.put<Optometrista>(`/api/optometristas/${id}`, data).then(r => r.data),
  toggle: (id: number) => api.patch(`/api/optometristas/${id}/toggle`),
};
