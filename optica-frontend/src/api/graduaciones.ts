import api from './client';
import type { Graduacion, GraduacionForm, PagedResponse } from '../types';

export const graduacionesApi = {
  getAll: (params?: {
    pacienteId?: number;
    desde?: string;
    hasta?: string;
    optometrista?: string;
    venta?: boolean;
    page?: number;
    pageSize?: number;
  }) =>
    api.get<PagedResponse<Graduacion>>('/api/graduaciones', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<Graduacion>(`/api/graduaciones/${id}`).then(r => r.data),

  create: (data: GraduacionForm) =>
    api.post<Graduacion>('/api/graduaciones', data).then(r => r.data),

  update: (id: number, data: Omit<GraduacionForm, 'pacienteId'>) =>
    api.put<Graduacion>(`/api/graduaciones/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/graduaciones/${id}`),

  toggleVenta: (id: number) =>
    api.patch<Graduacion>(`/api/graduaciones/${id}/venta`).then(r => r.data),
};
