import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graduacionesApi } from '../../api/graduaciones';
import { Spinner } from '../../components/ui';
import { ShoppingBag, Calendar, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const fmt = (v?: number | null) =>
  v !== null && v !== undefined ? (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)) : '—';

export default function SurtirPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['surtir', desde, hasta],
    queryFn: () =>
      graduacionesApi.getAll({ venta: true, desde, hasta, pageSize: 100 }),
  });

  const toggleVentaMut = useMutation({
    mutationFn: graduacionesApi.toggleVenta,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surtir'] }),
  });

  // Group by fecha
  type GraduacionItem = NonNullable<typeof data>['items'][number];
  const byDate = (data?.items ?? []).reduce<Record<string, GraduacionItem[]>>((acc, g) => {
    (acc[g.fecha] ??= []).push(g);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const handlePrint = () => {
    const formatFecha = (fecha: string) =>
      format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es });

    const periodoLabel =
      desde === hasta
        ? format(new Date(desde + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es })
        : `${format(new Date(desde + 'T00:00:00'), "d 'de' MMMM", { locale: es })} al ${format(new Date(hasta + 'T00:00:00'), "d 'de' MMMM yyyy", { locale: es })}`;

    const tablas = sortedDates.map(fecha => {
      const filas = byDate[fecha].map(g => {
        const od = g.ojoDerecho;
        const oi = g.ojoIzquierdo;
        return `
          <tr>
            <td>
              <strong>${g.apellidoPaciente}, ${g.nombrePaciente}</strong>
              ${g.optometrista ? `<br><span class="sub">${g.optometrista}</span>` : ''}
              ${g.observaciones ? `<br><span class="sub obs">${g.observaciones}</span>` : ''}
            </td>
            <td class="num od">${fmt(od?.esfera)}</td>
            <td class="num od">${fmt(od?.cilindro)}</td>
            <td class="num od">${od?.eje != null ? `${od.eje}°` : '—'}</td>
            <td class="num od">${fmt(od?.adicion)}</td>
            <td class="num od">${od?.av || '—'}</td>
            <td class="num oi">${fmt(oi?.esfera)}</td>
            <td class="num oi">${fmt(oi?.cilindro)}</td>
            <td class="num oi">${oi?.eje != null ? `${oi.eje}°` : '—'}</td>
            <td class="num oi">${fmt(oi?.adicion)}</td>
            <td class="num oi">${oi?.av || '—'}</td>
            <td class="num">${g.distanciaPupilar ?? '—'}</td>
            <td class="mat">${g.material || '—'}</td>
            <td class="mat">${g.disenoLente || '—'}</td>
            <td class="mat">${g.tratamiento || '—'}</td>
            <td class="check"></td>
          </tr>`;
      }).join('');

      return `
        <div class="day-block">
          <div class="day-header">
            <span>${formatFecha(fecha)}</span>
            <span class="day-count">${byDate[fecha].length} ${byDate[fecha].length === 1 ? 'venta' : 'ventas'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th rowspan="2" class="th-paciente">Paciente</th>
                <th colspan="5" class="th-group od">Ojo Derecho (OD)</th>
                <th colspan="5" class="th-group oi">Ojo Izquierdo (OI)</th>
                <th rowspan="2" class="th-dp">DP</th>
                <th rowspan="2" class="th-mat">Material</th>
                <th rowspan="2" class="th-mat">Diseño</th>
                <th rowspan="2" class="th-mat">Tratamiento</th>
                <th rowspan="2" class="th-check">✓</th>
              </tr>
              <tr>
                <th class="od">Esf</th><th class="od">Cil</th><th class="od">Eje</th><th class="od">Add</th><th class="od">AV</th>
                <th class="oi">Esf</th><th class="oi">Cil</th><th class="oi">Eje</th><th class="oi">Add</th><th class="oi">AV</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Material a Surtir — ${periodoLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #1f2937; padding: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; border-bottom: 2px solid #d97706; padding-bottom: 8px; }
    .header-left h1 { font-size: 18px; font-weight: bold; color: #92400e; }
    .header-left p { color: #6b7280; font-size: 11px; margin-top: 2px; }
    .header-right { text-align: right; color: #6b7280; font-size: 10px; }
    .day-block { margin-bottom: 14px; break-inside: avoid; }
    .day-header { display: flex; justify-content: space-between; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px 4px 0 0; padding: 5px 10px; font-weight: bold; font-size: 11px; color: #92400e; }
    .day-count { font-weight: normal; color: #b45309; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 4px 4px; }
    th { background: #f9fafb; padding: 4px 5px; text-align: center; font-size: 9px; font-weight: 600; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; border-right: 1px solid #f3f4f6; }
    th.th-paciente { text-align: left; padding-left: 8px; min-width: 130px; }
    th.th-group { font-size: 9px; }
    th.th-dp { min-width: 28px; }
    th.th-mat { min-width: 70px; }
    th.th-check { min-width: 20px; }
    th.od { color: #1d4ed8; }
    th.oi { color: #047857; }
    th.th-group.od { background: #eff6ff; color: #1d4ed8; }
    th.th-group.oi { background: #ecfdf5; color: #047857; }
    td { padding: 5px; border-bottom: 1px solid #f3f4f6; border-right: 1px solid #f9fafb; vertical-align: middle; }
    td.num { text-align: center; white-space: nowrap; }
    td.od { color: #1e40af; }
    td.oi { color: #065f46; }
    td.mat { color: #374151; }
    td.check { border: 1px solid #d1d5db; width: 20px; }
    tr:nth-child(even) td { background: #fafafa; }
    tr:last-child td { border-bottom: none; }
    .sub { font-size: 9px; color: #9ca3af; }
    .obs { font-style: italic; }
    .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 9px; text-align: center; }
    @media print {
      @page { size: A4 landscape; margin: 1cm; }
      body { padding: 0; }
      .day-block { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Lista de Material a Surtir</h1>
      <p>Período: ${periodoLabel} &nbsp;·&nbsp; ${data?.totalCount ?? 0} ventas pendientes</p>
    </div>
    <div class="header-right">
      Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}<br>
      ÓpticaSystem
    </div>
  </div>
  ${tablas}
  <div class="footer">Lista de surtido — ÓpticaSystem</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Filtro de fechas */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="input-field w-40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="input-field w-40"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 pb-1">
          <ShoppingBag className="w-4 h-4 text-amber-500" />
          {isLoading ? '...' : `${data?.totalCount ?? 0} ventas pendientes`}
        </div>
        {!isLoading && sortedDates.length > 0 && (
          <button
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Generar PDF
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-6 h-6 text-primary-500" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>No hay material pendiente de surtir en el período seleccionado.</p>
        </div>
      ) : (
        sortedDates.map(fecha => (
          <div key={fecha} className="card overflow-hidden">
            {/* Header del día */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                {format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <span className="ml-auto text-xs text-amber-600 font-medium">
                {byDate[fecha].length} {byDate[fecha].length === 1 ? 'venta' : 'ventas'}
              </span>
            </div>

            {/* Tabla de graduaciones del día */}
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Paciente</th>
                  <th className="text-center px-3 py-2 font-semibold text-blue-600" colSpan={5}>OD</th>
                  <th className="text-center px-3 py-2 font-semibold text-emerald-600" colSpan={5}>OI</th>
                  <th className="text-center px-2 py-2 font-semibold text-gray-500">DP</th>
                  <th className="text-left px-3 py-2 font-semibold text-blue-500">Material</th>
                  <th className="text-left px-3 py-2 font-semibold text-violet-500">Diseño</th>
                  <th className="text-left px-3 py-2 font-semibold text-emerald-500">Tratamiento</th>
                  <th className="px-3 py-2" />
                </tr>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-1" />
                  {['Esf', 'Cil', 'Eje', 'Add', 'AV'].map(h => (
                    <th key={`od-${h}`} className="text-center px-1 py-1 font-medium text-gray-400">{h}</th>
                  ))}
                  {['Esf', 'Cil', 'Eje', 'Add', 'AV'].map(h => (
                    <th key={`oi-${h}`} className="text-center px-1 py-1 font-medium text-gray-400">{h}</th>
                  ))}
                  <th colSpan={4} className="px-3 py-1" />
                  <th className="px-3 py-1" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byDate[fecha].map(g => {
                  const od = g.ojoDerecho;
                  const oi = g.ojoIzquierdo;
                  return (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{g.apellidoPaciente}, {g.nombrePaciente}</p>
                        {g.optometrista && <p className="text-gray-400">{g.optometrista}</p>}
                        {g.observaciones && <p className="text-gray-400 italic truncate max-w-[160px]">{g.observaciones}</p>}
                      </td>
                      {/* OD */}
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(od?.esfera)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(od?.cilindro)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{od?.eje != null ? `${od.eje}°` : '—'}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(od?.adicion)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{od?.av || '—'}</td>
                      {/* OI */}
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(oi?.esfera)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(oi?.cilindro)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{oi?.eje != null ? `${oi.eje}°` : '—'}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{fmt(oi?.adicion)}</td>
                      <td className="text-center px-1 py-2.5 text-gray-700">{oi?.av || '—'}</td>
                      {/* DP */}
                      <td className="text-center px-2 py-2.5 text-gray-700">{g.distanciaPupilar ?? '—'}</td>
                      {/* Material */}
                      <td className="px-3 py-2.5">
                        {g.material
                          ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">{g.material}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Diseño */}
                      <td className="px-3 py-2.5">
                        {g.disenoLente
                          ? <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">{g.disenoLente}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Tratamiento */}
                      <td className="px-3 py-2.5">
                        {g.tratamiento
                          ? <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">{g.tratamiento}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      {/* Acciones */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/pacientes/${g.pacienteId}`)}
                            title="Ver paciente"
                            className="p-1 text-gray-400 hover:text-primary-600 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleVentaMut.mutate(g.id)}
                            disabled={toggleVentaMut.isPending}
                            title="Marcar como surtido (quitar de lista)"
                            className="p-1 text-amber-500 hover:text-gray-400 rounded"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
