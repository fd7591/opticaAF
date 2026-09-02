import api from './client';
import type { Paciente, PacienteForm, PagedResponse, Graduacion, ExpedienteMedico } from '../types';

export const pacientesApi = {
  getAll: (params?: { search?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }) =>
    api.get<PagedResponse<Paciente>>('/api/pacientes', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<Paciente>(`/api/pacientes/${id}`).then(r => r.data),

  getGraduaciones: (id: number) =>
    api.get<Graduacion[]>(`/api/pacientes/${id}/graduaciones`).then(r => r.data),

  create: (data: PacienteForm) =>
    api.post<Paciente>('/api/pacientes', data).then(r => r.data),

  update: (id: number, data: PacienteForm) =>
    api.put<Paciente>(`/api/pacientes/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/api/pacientes/${id}`),

  getExpediente: (id: number) =>
    api.get<ExpedienteMedico>(`/api/pacientes/${id}/expediente`)
      .then(r => r.status === 204 ? null : r.data),

  upsertExpediente: (id: number, data: Omit<ExpedienteMedico, 'fechaActualizacion'>) =>
    api.put<ExpedienteMedico>(`/api/pacientes/${id}/expediente`, data).then(r => r.data),
};
