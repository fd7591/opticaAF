import api from './client';
import type { Optica } from '../types';

interface OpticaForm {
  nombre: string;
  razonSocial?: string;
  telefono?: string;
  email?: string;
}

export const opticasApi = {
  getAll: () => api.get<Optica[]>('/api/opticas').then(r => r.data),
  getById: (id: number) => api.get<Optica>(`/api/opticas/${id}`).then(r => r.data),
  create: (data: OpticaForm) => api.post<Optica>('/api/opticas', data).then(r => r.data),
  update: (id: number, data: OpticaForm) => api.put<Optica>(`/api/opticas/${id}`, data).then(r => r.data),
  toggle: (id: number) => api.patch(`/api/opticas/${id}/toggle`),
};
