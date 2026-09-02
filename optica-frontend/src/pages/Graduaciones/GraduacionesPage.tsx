import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graduacionesApi } from '../../api/graduaciones';
import { Modal, Spinner, Pagination } from '../../components/ui';
import GraduacionCard from '../../components/graduaciones/GraduacionCard';
import GraduacionForm from '../../components/graduaciones/GraduacionForm';
import type { GraduacionForm as GraduacionFormType, Graduacion } from '../../types';
import { Filter, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function GraduacionesPage() {
  const qc = useQueryClient();
  const { isOperador } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ desde: '', hasta: '', optometrista: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [modal, setModal] = useState<{ type: 'edit' | 'delete'; grad: Graduacion } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['graduaciones', appliedFilters, page],
    queryFn: () => graduacionesApi.getAll({
      desde: appliedFilters.desde || undefined,
      hasta: appliedFilters.hasta || undefined,
      optometrista: appliedFilters.optometrista || undefined,
      page,
      pageSize: 12,
    }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GraduacionFormType, 'pacienteId'> }) =>
      graduacionesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['graduaciones'] }); setModal(null); },
  });

  const deleteMut = useMutation({
    mutationFn: graduacionesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['graduaciones'] }); setModal(null); },
  });

  const toggleVentaMut = useMutation({
    mutationFn: graduacionesApi.toggleVenta,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['graduaciones'] }),
  });

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(filters);
    setPage(1);
  };

  const clearFilters = () => {
    const empty = { desde: '', hasta: '', optometrista: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const hasFilters = appliedFilters.desde || appliedFilters.hasta || appliedFilters.optometrista;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <form onSubmit={applyFilters} className="card p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
          <Filter className="w-4 h-4" /> Filtros de búsqueda
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={filters.desde}
              onChange={e => setFilters(f => ({ ...f, desde: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.hasta}
              onChange={e => setFilters(f => ({ ...f, hasta: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Optometrista</label>
            <input
              type="text"
              value={filters.optometrista}
              onChange={e => setFilters(f => ({ ...f, optometrista: e.target.value }))}
              placeholder="Nombre del profesional"
              className="input-field"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="btn-secondary text-sm">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
          <button type="submit" className="btn-primary text-sm">Aplicar filtros</button>
        </div>
      </form>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data ? `${data.totalCount} resultado${data.totalCount !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="w-6 h-6 text-primary-500" /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No se encontraron graduaciones con los filtros aplicados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map(g => {
            const canModify = !isOperador || g.fecha >= today;
            return (
              <GraduacionCard
                key={g.id}
                grad={g}
                showPatient
                onEdit={canModify ? () => setModal({ type: 'edit', grad: g }) : undefined}
                onDelete={canModify ? () => setModal({ type: 'delete', grad: g }) : undefined}
                onToggleVenta={() => toggleVentaMut.mutate(g.id)}
              />
            );
          })}
        </div>
      )}

      {data && data.totalCount > 12 && (
        <Pagination page={page} pageSize={12} total={data.totalCount} onChange={setPage} />
      )}

      {/* Edit modal */}
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Editar graduación" size="lg">
        {modal?.grad && (
          <GraduacionForm
            isEdit
            defaultValues={modal.grad}
            onSubmit={async (data) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { pacienteId: _pid, ...rest } = data;
              await updateMut.mutateAsync({ id: modal.grad.id, data: rest });
            }}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Delete modal */}
      <Modal open={modal?.type === 'delete'} onClose={() => setModal(null)} title="Eliminar graduación" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Confirmas eliminar la graduación de <strong>{modal?.grad?.apellidoPaciente}, {modal?.grad?.nombrePaciente}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
          <button
            onClick={() => modal?.grad && deleteMut.mutate(modal.grad.id)}
            className="btn-danger"
            disabled={deleteMut.isPending}
          >
            {deleteMut.isPending && <Spinner className="w-4 h-4" />}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
