import { useForm } from 'react-hook-form';
import type { PacienteForm as PacienteFormType } from '../../types';
import { Spinner } from '../ui';

interface Props {
  defaultValues?: Partial<PacienteFormType>;
  onSubmit: (data: PacienteFormType) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function PacienteForm({ defaultValues, onSubmit, onCancel, isEdit }: Props) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<PacienteFormType>({
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            {...register('nombre', { required: 'Requerido' })}
            className="input-field"
            placeholder="Juan"
          />
          {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
          <input
            {...register('apellido', { required: 'Requerido' })}
            className="input-field"
            placeholder="García"
          />
          {errors.apellido && <p className="text-xs text-red-500 mt-1">{errors.apellido.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
        <input {...register('fechaNacimiento')} type="date" className="input-field" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input {...register('telefono')} type="tel" placeholder="+54 11 5555 1234" className="input-field" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input {...register('email')} type="email" placeholder="paciente@email.com" className="input-field" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting && <Spinner className="w-4 h-4" />}
          {isEdit ? 'Guardar cambios' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  );
}
