import { useQuery } from '@tanstack/react-query';
import { pacientesApi } from '../api/pacientes';
import { graduacionesApi } from '../api/graduaciones';
import { Users, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { Spinner } from '../components/ui';
import GraduacionCard from '../components/graduaciones/GraduacionCard';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: pacientes } = useQuery({
    queryKey: ['pacientes', 'dashboard'],
    queryFn: () => pacientesApi.getAll({ pageSize: 1 }),
  });

  const { data: graduaciones, isLoading } = useQuery({
    queryKey: ['graduaciones', 'recent'],
    queryFn: () => graduacionesApi.getAll({ pageSize: 6 }),
  });

  const hoy = new Date().toISOString().split('T')[0];
  const { data: hoyData } = useQuery({
    queryKey: ['graduaciones', 'hoy'],
    queryFn: () => graduacionesApi.getAll({ desde: hoy, hasta: hoy, pageSize: 1 }),
  });

  const mesDesde = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const { data: mesData } = useQuery({
    queryKey: ['graduaciones', 'mes'],
    queryFn: () => graduacionesApi.getAll({ desde: mesDesde, pageSize: 1 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Bienvenido</h2>
        <p className="text-sm text-gray-500">Resumen del sistema de gestión de la óptica</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total pacientes" value={pacientes?.totalCount ?? '—'} color="bg-blue-500" />
        <StatCard icon={GraduationCap} label="Total graduaciones" value={graduaciones?.totalCount ?? '—'} color="bg-indigo-500" />
        <StatCard icon={Calendar} label="Graduaciones hoy" value={hoyData?.totalCount ?? '—'} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Este mes" value={mesData?.totalCount ?? '—'} color="bg-violet-500" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Últimas graduaciones registradas</h3>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="w-6 h-6 text-primary-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {graduaciones?.items.map(g => (
              <GraduacionCard key={g.id} grad={g} showPatient />
            ))}
          </div>
        )}
        {graduaciones?.items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No hay graduaciones registradas aún.</p>
        )}
      </div>
    </div>
  );
}
