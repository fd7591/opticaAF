import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { GraduacionForm } from '../../types';

interface Props {
  label: string;
  prefix: 'ojoDerecho' | 'ojoIzquierdo';
  register: UseFormRegister<GraduacionForm>;
  errors: FieldErrors<GraduacionForm>;
}

export default function OjoFormGroup({ label, prefix, register }: Props) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${prefix === 'ojoDerecho' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
        {label}
      </h4>
      <div className="grid grid-cols-5 gap-2">
        {[
          { field: 'esfera', label: 'Esfera', type: 'number', step: '0.25' },
          { field: 'cilindro', label: 'Cilindro', type: 'number', step: '0.25' },
          { field: 'eje', label: 'Eje (°)', type: 'number', step: '1' },
          { field: 'adicion', label: 'Adición', type: 'number', step: '0.25' },
          { field: 'av', label: 'AV', type: 'text', step: undefined },
        ].map(({ field, label: lbl, type, step }) => (
          <div key={field}>
            <label className="block text-xs text-gray-500 mb-1">{lbl}</label>
            <input
              {...register(`${prefix}.${field as keyof typeof register}` as any, {
                valueAsNumber: type === 'number' ? true : undefined,
              })}
              type={type}
              step={step}
              placeholder="—"
              className="input-field text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
