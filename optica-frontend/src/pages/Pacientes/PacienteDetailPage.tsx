import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pacientesApi } from '../../api/pacientes';
import { graduacionesApi } from '../../api/graduaciones';
import { Modal, Spinner, Alert } from '../../components/ui';
import GraduacionCard from '../../components/graduaciones/GraduacionCard';
import GraduacionForm from '../../components/graduaciones/GraduacionForm';
import RecetaLabel from '../../components/graduaciones/RecetaLabel';
import ExpedienteForm from '../../components/pacientes/ExpedienteForm';
import type { GraduacionForm as GraduacionFormType, Graduacion, ExpedienteMedico } from '../../types';
import { ArrowLeft, PlusCircle, Phone, Mail, Calendar, GraduationCap, ClipboardList, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

const today = new Date().toISOString().split('T')[0];

const EXPEDIENTE_LABELS: { key: keyof ExpedienteMedico; label: string }[] = [
  { key: 'ocupacion', label: 'Ocupación' },
  { key: 'alergias', label: 'Alergias conocidas' },
  { key: 'enfermedadesSistemicas', label: 'Enfermedades sistémicas' },
  { key: 'medicamentosActuales', label: 'Medicamentos actuales' },
  { key: 'antecedentesFamiliares', label: 'Antecedentes familiares oculares' },
  { key: 'observaciones', label: 'Observaciones generales' },
];

export default function PacienteDetailPage() {
  const { isOperador } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pacienteId = parseInt(id!);
  const [modal, setModal] = useState<{ type: 'create' | 'edit' | 'delete' | 'expediente' | 'print'; grad?: Graduacion } | null>(null);
  const [error, setError] = useState('');

  const { data: paciente, isLoading: loadingP } = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => pacientesApi.getById(pacienteId),
  });

  const { data: graduaciones, isLoading: loadingG } = useQuery({
    queryKey: ['graduaciones', 'paciente', pacienteId],
    queryFn: () => pacientesApi.getGraduaciones(pacienteId),
  });

  const { data: expediente, isLoading: loadingE } = useQuery({
    queryKey: ['expediente', pacienteId],
    queryFn: () => pacientesApi.getExpediente(pacienteId),
  });

  const createMut = useMutation({
    mutationFn: graduacionesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graduaciones', 'paciente', pacienteId] });
      qc.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      setModal(null);
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GraduacionFormType, 'pacienteId'> }) =>
      graduacionesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graduaciones', 'paciente', pacienteId] });
      setModal(null);
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: graduacionesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graduaciones', 'paciente', pacienteId] });
      qc.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      qc.invalidateQueries({ queryKey: ['pacientes'] });
      setModal(null);
    },
  });

  const expedienteMut = useMutation({
    mutationFn: (data: Omit<ExpedienteMedico, 'fechaActualizacion'>) =>
      pacientesApi.upsertExpediente(pacienteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expediente', pacienteId] });
      setModal(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleVentaMut = useMutation({
    mutationFn: graduacionesApi.toggleVenta,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['graduaciones', 'paciente', pacienteId] }),
  });

  if (loadingP) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8 text-primary-500" /></div>;
  if (!paciente) return <div className="text-center py-16 text-gray-400">Paciente no encontrado.</div>;

  const expedienteFields = EXPEDIENTE_LABELS.filter(({ key }) => expediente?.[key]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/pacientes')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {paciente.apellido}, {paciente.nombre}
          </h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
            {paciente.telefono && (
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{paciente.telefono}</span>
            )}
            {paciente.email && (
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{paciente.email}</span>
            )}
            {paciente.fechaNacimiento && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(paciente.fechaNacimiento + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary flex-shrink-0">
          <PlusCircle className="w-4 h-4" />
          Nueva graduación
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 rounded-xl border border-primary-100">
        <GraduationCap className="w-5 h-5 text-primary-600" />
        <span className="text-sm font-medium text-primary-700">
          {paciente.totalGraduaciones} graduación{paciente.totalGraduaciones !== 1 ? 'es' : ''} registrada{paciente.totalGraduaciones !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Expediente Médico */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Expediente médico</h2>
          </div>
          {!loadingE && (
            <button
              onClick={() => setModal({ type: 'expediente' })}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Pencil className="w-3.5 h-3.5" />
              {expediente ? 'Editar' : 'Completar expediente'}
            </button>
          )}
        </div>

        {loadingE ? (
          <div className="flex justify-center py-4"><Spinner className="w-5 h-5 text-primary-400" /></div>
        ) : !expediente || expedienteFields.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sin información médica registrada.</p>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {expedienteFields.map(({ key, label }) => (
              <div key={key}>
                <dt className="text-xs font-medium text-gray-500">{label}</dt>
                <dd className="text-sm text-gray-800 whitespace-pre-wrap">{String(expediente[key])}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Graduaciones */}
      {error && <Alert type="error" message={error} />}

      {loadingG ? (
        <div className="flex justify-center py-8"><Spinner className="w-6 h-6 text-primary-500" /></div>
      ) : graduaciones?.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay graduaciones registradas para este paciente.</p>
          <button onClick={() => setModal({ type: 'create' })} className="btn-primary mt-4">
            <PlusCircle className="w-4 h-4" />
            Registrar primera graduación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {graduaciones?.map(g => {
            const canModify = !isOperador || g.fecha >= today;
            return (
              <GraduacionCard
                key={g.id}
                grad={g}
                onPrint={() => setModal({ type: 'print', grad: g })}
                onEdit={canModify ? () => setModal({ type: 'edit', grad: g }) : undefined}
                onDelete={canModify ? () => setModal({ type: 'delete', grad: g }) : undefined}
                onToggleVenta={() => toggleVentaMut.mutate(g.id)}
              />
            );
          })}
        </div>
      )}

      {/* Expediente modal */}
      <Modal open={modal?.type === 'expediente'} onClose={() => setModal(null)} title="Expediente médico" size="lg">
        <ExpedienteForm
          defaultValues={expediente ?? undefined}
          onSubmit={async data => { await expedienteMut.mutateAsync(data); }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Create graduacion modal */}
      <Modal open={modal?.type === 'create'} onClose={() => setModal(null)} title="Nueva graduación" size="lg">
        <GraduacionForm
          pacienteId={pacienteId}
          onSubmit={async data => { await createMut.mutateAsync(data); }}
          onCancel={() => setModal(null)}
        />
      </Modal>

      {/* Edit graduacion modal */}
      <Modal open={modal?.type === 'edit'} onClose={() => setModal(null)} title="Editar graduación" size="lg">
        {modal?.grad && (
          <GraduacionForm
            isEdit
            defaultValues={modal.grad}
            onSubmit={async (data) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { pacienteId: _pid, ...rest } = data;
              await updateMut.mutateAsync({ id: modal.grad!.id, data: rest });
            }}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Print receta modal */}
      <Modal open={modal?.type === 'print'} onClose={() => setModal(null)} title="Receta" size="sm">
        {modal?.grad && (
          <RecetaLabel
            nombre={paciente.nombre}
            apellido={paciente.apellido}
            grad={modal.grad}
          />
        )}
      </Modal>

      {/* Delete graduacion modal */}
      <Modal open={modal?.type === 'delete'} onClose={() => setModal(null)} title="Eliminar graduación" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Confirmas que deseas eliminar la graduación del{' '}
          <strong>{modal?.grad?.fecha && format(new Date(modal.grad.fecha + 'T00:00:00'), "d/MM/yyyy")}</strong>?
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
