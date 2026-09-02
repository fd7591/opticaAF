import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { Modal, Spinner, Badge } from '../../components/ui';
import { sucursalesApi } from '../../api/sucursales';
import { opticasApi } from '../../api/opticas';
import { useAuth } from '../../context/AuthContext';
import type { Sucursal } from '../../types';

interface SucursalForm {
  opticaId: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export default function SucursalesPage() {
  const qc = useQueryClient();
  const { isSuperAdmin, user } = useAuth();
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Sucursal | null>(null);

  const { data: opticas } = useQuery({
    queryKey: ['opticas'],
    queryFn: opticasApi.getAll,
    enabled: isSuperAdmin,
  });

  const { data: sucursales, isLoading } = useQuery<Sucursal[]>({
    queryKey: ['sucursales'],
    queryFn: () => sucursalesApi.getAll(),
  });

  const crearMut = useMutation({
    mutationFn: (data: SucursalForm) => sucursalesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sucursales'] }); setModal(null); },
  });

  const editarMut = useMutation({
    mutationFn: (data: SucursalForm) => sucursalesApi.update(editando!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sucursales'] }); setModal(null); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => sucursalesApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sucursales'] }),
  });

  const form = useForm<SucursalForm>({
    defaultValues: { opticaId: user?.opticaId ?? 0 },
  });

  const openCrear = () => {
    form.reset({ opticaId: user?.opticaId ?? 0 });
    setEditando(null);
    setModal('crear');
  };

  const openEditar = (s: Sucursal) => {
    form.reset({ opticaId: s.opticaId, nombre: s.nombre, direccion: s.direccion ?? '', telefono: s.telefono ?? '' });
    setEditando(s);
    setModal('editar');
  };

  const onSubmit = (data: SucursalForm) => {
    if (modal === 'crear') crearMut.mutate(data);
    else editarMut.mutate(data);
  };

  const isPending = crearMut.isPending || editarMut.isPending;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sucursales</h2>
          <p className="text-sm text-gray-500">Gestión de sucursales de la óptica</p>
        </div>
        <button onClick={openCrear} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva sucursal
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
              {isSuperAdmin && <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Óptica</th>}
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Dirección</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Teléfono</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="w-5 h-5 text-primary-500 mx-auto" /></td></tr>
            )}
            {sucursales?.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{s.nombre}</span>
                  </div>
                </td>
                {isSuperAdmin && <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{s.nombreOptica}</td>}
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{s.direccion || '—'}</td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{s.telefono || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge label={s.activo ? 'Activa' : 'Inactiva'} color={s.activo ? 'green' : 'red'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEditar(s)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMut.mutate(s.id)}
                      disabled={toggleMut.isPending}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={s.activo ? 'Desactivar' : 'Activar'}
                    >
                      {s.activo
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
        title={modal === 'crear' ? 'Nueva sucursal' : 'Editar sucursal'}
        size="sm"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Óptica *</label>
              <select {...form.register('opticaId', { required: true, valueAsNumber: true })} className="input-field">
                <option value="">Seleccionar óptica...</option>
                {opticas?.map(o => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input {...form.register('nombre', { required: true })} className="input-field" placeholder="Sucursal Centro" />
            {form.formState.errors.nombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input {...form.register('direccion')} className="input-field" placeholder="Av. Corrientes 1234" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input {...form.register('telefono')} className="input-field" placeholder="+54 11 ..." />
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
