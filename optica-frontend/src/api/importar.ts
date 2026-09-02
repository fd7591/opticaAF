import api from './client';
import type { ImportResult, ImportPegarRow, ImportJobStatus } from '../types';

export const importarApi = {
  uploadCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportResult>('/api/import/csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  downloadTemplate: () =>
    api.get('/api/import/plantilla', { responseType: 'blob' }).then(r => r.data),

  importarPegar: (fecha: string, filas: ImportPegarRow[]) =>
    api.post<ImportResult>('/api/import/pegar', { fecha, filas }).then(r => r.data),

  startXlsxImport: (file: File, sucursalId?: number, optometristaId?: number, optometristaTexto?: string) => {
    const form = new FormData();
    form.append('file', file);
    const params: Record<string, string> = {};
    if (sucursalId) params.sucursalId = String(sucursalId);
    if (optometristaId) params.optometristaId = String(optometristaId);
    if (optometristaTexto) params.optometristaTexto = optometristaTexto;
    return api.post<{ jobId: string; total: number }>('/api/import/xlsx', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params,
    }).then(r => r.data);
  },

  getJobStatus: (jobId: string) =>
    api.get<ImportJobStatus>(`/api/import/job/${jobId}`).then(r => r.data),
};
