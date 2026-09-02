import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Building2, Plus, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Modal, Spinner, Badge } from '../../components/ui';
import { opticasApi } from '../../api/opticas';
import type { Optica } from '../../types';

interface OpticaForm {
  nombre: string;
  razonSocial?: string;
  telefono?: string;
  email?: string;
}

export default function OpticasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [editando, setEditando] = useState<Optica | null>(null);

  const { data: opticas, isLoading } = useQuery<Optica[]>({
    queryKey: ['opticas'],
    queryFn: opticasApi.getAll,
  });

  const crearMut = useMutation({
    mutationFn: (data: OpticaForm) => opticasApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opticas'] }); setModal(null); },
  });

  const editarMut = useMutation({
    mutationFn: (data: OpticaForm) => opticasApi.update(editando!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['opticas'] }); setModal(null); },
  });

  const toggleMut = useMutation({
    mutationFn: (id: number) => opticasApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opticas'] }),
  });

  const form = useForm<OpticaForm>();

  const openCrear = () => {
    form.reset({});
    setEditando(null);
    setModal('crear');
  };

  const openEditar = (o: Optica) => {
    form.reset({ nombre: o.nombre, razonSocial: o.razonSocial ?? '', telefono: o.telefono ?? '', email: o.email ?? '' });
    setEditando(o);
    setModal('editar');
  };

  const onSubmit = (data: OpticaForm) => {
    if (modal === 'crear') crearMut.mutate(data);
    else editarMut.mutate(data);
  };

  const isPending = crearMut.isPending || editarMut.isPending;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ópticas</h2>
          <p className="text-sm text-gray-500">Gestión de ópticas registradas en el sistema</p>
        </div>
        <button onClick={openCrear} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nueva óptica
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Razón Social</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Teléfono</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Creada</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="w-5 h-5 text-primary-500 mx-auto" /></td></tr>
            )}
            {opticas?.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{o.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{o.razonSocial || '—'}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{o.telefono || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                  {format(new Date(o.fechaCreacion), 'dd/MM/yyyy')}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge label={o.activo ? 'Activa' : 'Inactiva'} color={o.activo ? 'green' : 'red'} />
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
        title={modal === 'crear' ? 'Nueva óptica' : 'Editar óptica'}
        size="sm"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input {...form.register('nombre', { required: true })} className="input-field" placeholder="Óptica del Sur" />
            {form.formState.errors.nombre && <p className="text-xs text-red-500 mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
            <input {...form.register('razonSocial')} className="input-field" placeholder="Óptica del Sur S.A." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input {...form.register('telefono')} className="input-field" placeholder="+54 11 ..." />
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
