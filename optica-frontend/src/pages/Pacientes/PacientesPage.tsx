import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pacientesApi } from '../../api/pacientes';
import { Modal, Spinner, Pagination, Badge } from '../../components/ui';
import PacienteForm from '../../components/pacientes/PacienteForm';
import type { PacienteForm as PacienteFormType, Paciente } from '../../types';
import { Search, UserPlus, Pencil, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { format } from 'date-fns';

type SortField = 'apellido' | 'fechaCreacion';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: SortDir }) {
  if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 ml-1 inline" />;
  return sortDir === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-primary-600 ml-1 inline" />
    : <ArrowDown className="w-3.5 h-3.5 text-primary-600 ml-1 inline" />;
}

export default function PacientesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('apellido');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modal, setModal] = useState<{ type: 'create' | 'edit' | 'delete'; paciente?: Paciente } | null>(null);

  // Debounce search input: espera 350ms tras el último cambio
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['pacientes', search, page, sortBy, sortDir],
    queryFn: () => pacientesApi.getAll({ search: search || undefined, page, pageSize: 15, sortBy, sortDir }),
    placeholderData: prev => prev,
  });

  const createMut = useMutation({
    mutationFn: pacientesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pacientes'] }); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PacienteFormType }) => pacientesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pacientes'] }); setModal(null); },
  });

  const deleteMut = useMutation({
    mutationFn: pacientesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pacientes'] }); setModal(null); },
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            className="input-field pl-9 pr-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Nuevo paciente
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <button
                    onClick={() => handleSort('apellido')}
                    className="flex items-center hover:text-primary-700 transition-colors"
                  >
                    Paciente
                    <SortIcon field="apellido" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Fecha nacimiento</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">
                  <button
                    onClick={() => handleSort('fechaCreacion')}
                    className="flex items-center hover:text-primary-700 transition-colors"
                  >
                    Registro
                    <SortIcon field="fechaCreacion" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Graduaciones</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-50 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {isLoading && (
                <tr><td colSpan={6} className="text-center py-12"><Spinner className="w-6 h-6 text-primary-500 mx-auto" /></td></tr>
              )}
              {!isLoading && data?.items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No se encontraron pacientes.</td></tr>
              )}
              {data?.items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.nombre} {p.apellido}</p>
                    {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{p.telefono || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {p.fechaNacimiento
                      ? format(new Date(p.fechaNacimiento + 'T00:00:00'), 'dd/MM/yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {format(new Date(p.fechaCreacion), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      label={`${p.totalGraduaciones}`}
                      color={p.totalGraduaciones > 0 ? 'blue' : 'gray'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/pacientes/${p.id}`)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'edit', paciente: p })}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', paciente: p })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalCount > 15 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <Pagination page={page} pageSize={15} total={data.totalCount} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modal?.type === 'create'} onClose={() => setModal(null)} title="Nuevo paciente">
        <PacienteForm
          onSubmit={async data => { await createMut.mutateAsync(data); }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Editar paciente">
        {modal?.paciente && (
          <PacienteForm
            isEdit
            defaultValues={modal.paciente}
            onSubmit={async data => { await updateMut.mutateAsync({ id: modal.paciente!.id, data }); }}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={modal?.type === 'delete'} onClose={() => setModal(null)} title="Eliminar paciente" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Estás seguro que deseas eliminar a <strong>{modal?.paciente?.nombre} {modal?.paciente?.apellido}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
          <button
            onClick={() => modal?.paciente && deleteMut.mutate(modal.paciente.id)}
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
