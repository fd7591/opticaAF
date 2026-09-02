import type { Graduacion } from '../../types';
import { Pencil, Trash2, ShoppingBag, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OjoRowProps {
  label: string;
  ojo: Graduacion['ojoDerecho'];
  color: string;
}

function OjoRow({ label, ojo, color }: OjoRowProps) {
  const fmt = (v?: number | null) => (v !== null && v !== undefined ? (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) : '—');
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <div className="grid grid-cols-5 gap-1 text-xs">
          {[
            ['Esf', fmt(ojo?.esfera)],
            ['Cil', fmt(ojo?.cilindro)],
            ['Eje', ojo?.eje != null ? `${ojo.eje}°` : '—'],
            ['Add', fmt(ojo?.adicion)],
            ['AV', ojo?.av || '—'],
          ].map(([k, v]) => (
            <div key={k} className="text-center">
              <p className="text-gray-400">{k}</p>
              <p className="font-medium text-gray-800">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  grad: Graduacion;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVenta?: () => void;
  onPrint?: () => void;
  showPatient?: boolean;
}

export default function GraduacionCard({ grad, onEdit, onDelete, onToggleVenta, onPrint, showPatient = false }: Props) {
  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          {showPatient && (
            <p className="text-sm font-semibold text-gray-900">
              {grad.apellidoPaciente}, {grad.nombrePaciente}
            </p>
          )}
          <p className="text-sm font-medium text-primary-700">
            {format(new Date(grad.fecha + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
          {grad.optometrista && (
            <p className="text-xs text-gray-500 mt-0.5">{grad.optometrista}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {grad.venta && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <ShoppingBag className="w-3 h-3" />
              Venta
            </span>
          )}
          {onToggleVenta && (
            <button
              onClick={onToggleVenta}
              title={grad.venta ? 'Quitar venta' : 'Marcar venta'}
              className={`p-1.5 rounded-lg transition-colors ${grad.venta ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          )}
          {onPrint && (
            <button onClick={onPrint} title="Ver receta" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <OjoRow label="Ojo Derecho (OD)" ojo={grad.ojoDerecho} color="bg-blue-400" />
        <OjoRow label="Ojo Izquierdo (OI)" ojo={grad.ojoIzquierdo} color="bg-emerald-400" />
      </div>

      {(grad.distanciaPupilar || grad.observaciones) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          {grad.distanciaPupilar && <span>DP: <strong>{grad.distanciaPupilar} mm</strong></span>}
          {grad.observaciones && <span className="truncate">{grad.observaciones}</span>}
        </div>
      )}

      {(grad.material || grad.disenoLente || grad.tratamiento) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {grad.material && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{grad.material}</span>
          )}
          {grad.disenoLente && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-200">{grad.disenoLente}</span>
          )}
          {grad.tratamiento && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">{grad.tratamiento}</span>
          )}
        </div>
      )}
    </div>
  );
}
