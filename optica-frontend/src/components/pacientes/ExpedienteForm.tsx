import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ExpedienteMedico } from '../../types';
import { Spinner } from '../ui';

type ExpedienteFormData = Omit<ExpedienteMedico, 'fechaActualizacion'>;

const OCUPACIONES = [
  'Administrativo/a', 'Abogado/a', 'Arquitecto/a', 'Chofer / Transporte',
  'Cocinero/a', 'Comerciante', 'Contador/a', 'Costurero/a', 'Diseñador/a',
  'Docente', 'Electricista', 'Enfermero/a', 'Estudiante', 'Ingeniero/a',
  'Jubilado/a', 'Médico/a', 'Mecánico/a', 'Ama/o de casa',
  'Plomero/a', 'Programador/a', 'Psicólogo/a', 'Otra',
];

const ALERGIAS = [
  'Ninguna conocida', 'Penicilina', 'Amoxicilina', 'Aspirina / AAS',
  'Ibuprofeno', 'Sulfas', 'Polen', 'Ácaros del polvo', 'Látex',
  'Mariscos', 'Nueces / Frutos secos', 'Lácteos', 'Anestésicos locales',
];

const ENFERMEDADES = [
  'Diabetes tipo 1', 'Diabetes tipo 2', 'Hipertensión arterial',
  'Hipotiroidismo', 'Hipertiroidismo', 'Artritis reumatoide',
  'Lupus eritematoso', 'Síndrome de Sjögren', 'Esclerosis múltiple',
  'Anemia', 'Asma', 'EPOC', 'Enfermedad cardiovascular',
];

const ANTECEDENTES = [
  'Ninguno conocido', 'Glaucoma', 'Cataratas', 'Degeneración macular',
  'Miopía alta', 'Daltonismo', 'Retinosis pigmentaria', 'Queratocono',
  'Estrabismo', 'Ambliopía (ojo vago)', 'Desprendimiento de retina',
  'Uveítis', 'Pterigión',
];

const parseList = (val?: string | null): string[] =>
  val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];

const joinList = (arr: string[]): string =>
  arr.filter(Boolean).join(', ');

function CheckGroup({
  label, options, selected, onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  };
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const checked = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                checked
                  ? 'bg-primary-100 border-primary-400 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">
          Seleccionado: {selected.join(', ')}
        </p>
      )}
    </div>
  );
}

interface Props {
  defaultValues?: ExpedienteFormData;
  onSubmit: (data: ExpedienteFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ExpedienteForm({ defaultValues, onSubmit, onCancel }: Props) {
  const [alergias, setAlergias] = useState<string[]>(parseList(defaultValues?.alergias));
  const [enfermedades, setEnfermedades] = useState<string[]>(parseList(defaultValues?.enfermedadesSistemicas));
  const [antecedentes, setAntecedentes] = useState<string[]>(parseList(defaultValues?.antecedentesFamiliares));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      ocupacion: defaultValues?.ocupacion ?? '',
      ocupacionOtra: '',
      medicamentosActuales: defaultValues?.medicamentosActuales ?? '',
      observaciones: defaultValues?.observaciones ?? '',
    },
  });

  const ocupacionVal = watch('ocupacion');

  const handleFormSubmit = handleSubmit(async (raw) => {
    setIsSubmitting(true);
    try {
      const ocupacion = raw.ocupacion === 'Otra'
        ? raw.ocupacionOtra || 'Otra'
        : raw.ocupacion;

      await onSubmit({
        ocupacion: ocupacion || null,
        alergias: alergias.length ? joinList(alergias) : null,
        enfermedadesSistemicas: enfermedades.length ? joinList(enfermedades) : null,
        medicamentosActuales: raw.medicamentosActuales || null,
        antecedentesFamiliares: antecedentes.length ? joinList(antecedentes) : null,
        observaciones: raw.observaciones || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      {/* Ocupación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación</label>
        <select {...register('ocupacion')} className="input-field">
          <option value="">— Sin especificar —</option>
          {OCUPACIONES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {ocupacionVal === 'Otra' && (
          <input
            {...register('ocupacionOtra')}
            className="input-field mt-2"
            placeholder="Especificá la ocupación..."
          />
        )}
      </div>

      {/* Alergias */}
      <CheckGroup
        label="Alergias conocidas"
        options={ALERGIAS}
        selected={alergias}
        onChange={setAlergias}
      />

      {/* Enfermedades sistémicas */}
      <CheckGroup
        label="Enfermedades sistémicas"
        options={ENFERMEDADES}
        selected={enfermedades}
        onChange={setEnfermedades}
      />

      {/* Medicamentos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos actuales</label>
        <textarea
          {...register('medicamentosActuales')}
          rows={2}
          className="input-field resize-none"
          placeholder="Ej: Metformina 500mg, Losartán 50mg..."
        />
      </div>

      {/* Antecedentes familiares */}
      <CheckGroup
        label="Antecedentes familiares oculares"
        options={ANTECEDENTES}
        selected={antecedentes}
        onChange={setAntecedentes}
      />

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones generales</label>
        <textarea
          {...register('observaciones')}
          rows={2}
          className="input-field resize-none"
          placeholder="Notas adicionales relevantes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <Spinner className="w-4 h-4" />}
          Guardar expediente
        </button>
      </div>
    </form>
  );
}
