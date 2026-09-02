import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import type { GraduacionForm as GraduacionFormType } from '../../types';
import OjoFormGroup from './OjoFormGroup';
import { Spinner } from '../ui';
import { optometristasApi } from '../../api/optometristas';
import { useAuth } from '../../context/AuthContext';

// ── Catálogos ──────────────────────────────────────────────────────────────
const CAT_MATERIAL = [
  'CR-39', 'Policarbonato', 'Trivex',
  'Alto índice 1.60', 'Alto índice 1.67', 'Alto índice 1.74',
  'Cristal mineral',
];

const CAT_DISENO = [
  'Monofocal', 'Bifocal flat-top 28', 'Bifocal flat-top 35',
  'Bifocal ejecutivo', 'Progresivo', 'Progresivo digital', 'Ocupacional',
];

const CAT_TRATAMIENTO = [
  'Blanco', 'Antirreflejante', 'AR + Blue-cut',
  'Fotocromático gris', 'Fotocromático café', 'Fotocromático + AR',
  'Polarizado', 'Espejo',
];
// ───────────────────────────────────────────────────────────────────────────

function ChipSelect({
  label, color, options, value, onChange,
}: {
  label: string;
  color: 'blue' | 'violet' | 'emerald';
  options: string[];
  value?: string | null;
  onChange: (v: string | null) => void;
}) {
  const styles = {
    blue:    { active: 'bg-blue-100 border-blue-400 text-blue-700',    base: 'border-gray-200 text-gray-600 hover:border-blue-300' },
    violet:  { active: 'bg-violet-100 border-violet-400 text-violet-700', base: 'border-gray-200 text-gray-600 hover:border-violet-300' },
    emerald: { active: 'bg-emerald-100 border-emerald-400 text-emerald-700', base: 'border-gray-200 text-gray-600 hover:border-emerald-300' },
  };
  const s = styles[color];

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              value === opt ? s.active : `bg-white ${s.base}`
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Props {
  defaultValues?: Partial<GraduacionFormType>;
  pacienteId?: number;
  onSubmit: (data: GraduacionFormType) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function GraduacionForm({ defaultValues, pacienteId, onSubmit, onCancel, isEdit }: Props) {
  const { user } = useAuth();

  const { data: optometristas } = useQuery({
    queryKey: ['optometristas', user?.sucursalId],
    queryFn: () => optometristasApi.getAll(user?.sucursalId ?? undefined),
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<GraduacionFormType>({
    defaultValues: {
      pacienteId: pacienteId || defaultValues?.pacienteId,
      fecha: defaultValues?.fecha || new Date().toISOString().split('T')[0],
      ojoDerecho: defaultValues?.ojoDerecho || {},
      ojoIzquierdo: defaultValues?.ojoIzquierdo || {},
      distanciaPupilar: defaultValues?.distanciaPupilar,
      observaciones: defaultValues?.observaciones || '',
      optometrista: defaultValues?.optometrista || '',
      optometristaId: defaultValues?.optometristaId,
      venta: defaultValues?.venta ?? false,
      material: defaultValues?.material ?? null,
      disenoLente: defaultValues?.disenoLente ?? null,
      tratamiento: defaultValues?.tratamiento ?? null,
    },
  });

  const optometristaIdValue = watch('optometristaId');
  const material    = watch('material');
  const disenoLente = watch('disenoLente');
  const tratamiento = watch('tratamiento');

  const handleOptometristaChange = (id: number | undefined) => {
    setValue('optometristaId', id);
    if (id) {
      const found = optometristas?.find(o => o.id === id);
      if (found) setValue('optometrista', `${found.nombre} ${found.apellido}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Fecha + DP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
          <input {...register('fecha', { required: true })} type="date" className="input-field" />
          {errors.fecha && <p className="text-xs text-red-500 mt-1">Fecha requerida</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Distancia Pupilar (mm)</label>
          <input
            {...register('distanciaPupilar', { valueAsNumber: true })}
            type="number" step="0.5" placeholder="62.5" className="input-field"
          />
        </div>
      </div>

      {/* Ojos */}
      <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-xl">
        <OjoFormGroup label="Ojo Derecho (OD)" prefix="ojoDerecho" register={register} errors={errors} />
        <hr className="border-gray-200" />
        <OjoFormGroup label="Ojo Izquierdo (OI)" prefix="ojoIzquierdo" register={register} errors={errors} />
      </div>

      {/* Optometrista */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Optometrista</label>
        {optometristas && optometristas.length > 0 ? (
          <div className="space-y-2">
            <select
              value={optometristaIdValue ?? ''}
              onChange={e => handleOptometristaChange(e.target.value ? Number(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Seleccionar optometrista...</option>
              {optometristas.filter(o => o.activo).map(o => (
                <option key={o.id} value={o.id}>{o.apellido}, {o.nombre}</option>
              ))}
            </select>
            {!optometristaIdValue && (
              <input {...register('optometrista')} type="text" placeholder="O escribir nombre manualmente" className="input-field text-sm" />
            )}
          </div>
        ) : (
          <input {...register('optometrista')} type="text" placeholder="Nombre del profesional" className="input-field" />
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea {...register('observaciones')} rows={2} placeholder="Notas adicionales..." className="input-field resize-none" />
      </div>

      {/* ── Pedido de material ────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">Pedido de material</p>

        <ChipSelect
          label="Material"
          color="blue"
          options={CAT_MATERIAL}
          value={material}
          onChange={v => setValue('material', v)}
        />

        <ChipSelect
          label="Diseño / Visión"
          color="violet"
          options={CAT_DISENO}
          value={disenoLente}
          onChange={v => setValue('disenoLente', v)}
        />

        <ChipSelect
          label="Tratamiento"
          color="emerald"
          options={CAT_TRATAMIENTO}
          value={tratamiento}
          onChange={v => setValue('tratamiento', v)}
        />
      </div>
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* Venta */}
      <label className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
        <input {...register('venta')} type="checkbox" className="w-4 h-4 rounded accent-amber-500" />
        <div>
          <p className="text-sm font-medium text-amber-800">Se realizó venta — requiere surtir material</p>
          <p className="text-xs text-amber-600">Marcá si el paciente adquirió lentes u otros productos</p>
        </div>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <Spinner className="w-4 h-4" />}
          {isEdit ? 'Guardar cambios' : 'Registrar graduación'}
        </button>
      </div>
    </form>
  );
}
