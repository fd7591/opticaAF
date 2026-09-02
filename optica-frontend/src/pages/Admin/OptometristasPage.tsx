import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UserCheck, Plus, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { Modal, Spinner, Badge } from '../../components/ui';
import { optometristasApi } from '../../api/optometristas';
import { sucursalesApi } from '../../api/sucursales';
import { useAuth } from '../../context/AuthContext';
import type { Optometrista } from '../../types';

interface OptometristaForm {
  sucursalId: number;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  email?: string;
}

export default function OptometristasPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Optometrista | null>(null);

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => sucursalesApi.getAll(),
  });

  const { data: optometristas, isLoading } = useQuery<Optometrista[]>({
    queryKey: ['optometristas'],
    queryFn: () => optometristasApi.getAll(),
  });

  const crearMut = useMutation({
    mutationFn: (data: OptometristaForm) => optometristasApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['optometristas'] }); setModal(null); },
  });

  const editarMut = useMutation({
    mutationFn: (data: OptometristaForm) => optometristasApi.update(editando!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['optometristas'] }); setModal(null); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => optometristasApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['optometristas'] }),
  });

  const form = useForm<OptometristaForm>({
    defaultValues: { sucursalId: user?.sucursalId ?? 0 },
  });

  const openCrear = () => {
    form.reset({ sucursalId: user?.sucursalId ?? 0 });
    setEditando(null);
    setModal('crear');
  };

  const openEditar = (o: Optometrista) => {
    form.reset({
      sucursalId: o.sucursalId,
      nombre: o.nombre,
      apellido: o.apellido,
      cedula: o.cedula ?? '',
      telefono: o.telefono ?? '',
      email: o.email ?? '',
    });
    setEditando(o);
    setModal('editar');
  };

  const onSubmit = (data: OptometristaForm) => {
    if (modal === 'crear') crearMut.mutate(data);
    else editarMut.mutate(data);
  };

  const isPending = crearMut.isPending || editarMut.isPending;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Optometristas</h2>
          <p className="text-sm text-gray-500">Profesionales registrados por sucursal</p>
        </div>
        <button onClick={openCrear} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo optometrista
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Sucursal</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Cédula</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Teléfono</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="w-5 h-5 text-primary-500 mx-auto" /></td></tr>
            )}
            {optometristas?.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{o.apellido}, {o.nombre}</p>
                      {o.email && <p className="text-xs text-gray-500">{o.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{o.nombreSucursal}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{o.cedula || '—'}</td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{o.telefono || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge label={o.activo ? 'Activo' : 'Inactivo'} color={o.activo ? 'green' : 'red'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEditar(o)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMut.mutate(o.id)}
                      disabled={toggleMut.isPending}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={o.activo ? 'Desactivar' : 'Activar'}
                    >
                      {o.activo
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'crear' ? 'Nuevo optometrista' : 'Editar optometrista'}
        size="sm"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <select {...form.register('sucursalId', { required: true, valueAsNumber: true })} className="input-field">
              <option value="">Seleccionar sucursal...</option>
              {sucursales?.filter(s => s.activo).map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input {...form.register('nombre', { required: true })} className="input-field" placeholder="María" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input {...form.register('apellido', { required: true })} className="input-field" placeholder="López" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / Matrícula</label>
            <input {...form.register('cedula')} className="input-field" placeholder="MP 12345" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input {...form.register('telefono')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...form.register('email')} type="email" className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending && <Spinner className="w-4 h-4" />}
              {modal === 'crear' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
