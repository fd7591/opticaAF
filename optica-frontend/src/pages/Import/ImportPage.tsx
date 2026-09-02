import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { importarApi } from '../../api/importar';
import { sucursalesApi } from '../../api/sucursales';
import { optometristasApi } from '../../api/optometristas';
import type { ImportResult, ImportJobStatus } from '../../types';
import { Alert, Spinner } from '../../components/ui';
import { Upload, FileText, Download, XCircle, ClipboardPaste, CheckCircle2, AlertTriangle, FileSpreadsheet, Users, UserCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { parseTexto, toImportRow, formatOjoPreview, type ParsedRowPreview } from '../../utils/prescripcionParser';

// ─── CSV Tab ──────────────────────────────────────────────────────────────────

function CsvTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await importarApi.uploadCsv(file);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Error al procesar el archivo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: loading,
  });

  const handleDownloadTemplate = async () => {
    try {
      const blob = await importarApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_graduaciones.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar la plantilla.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Download template */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800">Plantilla de importación</p>
            <p className="text-xs text-gray-500 mt-0.5">Descarga el archivo de ejemplo con el formato correcto</p>
          </div>
        </div>
        <button onClick={handleDownloadTemplate} className="btn-secondary flex-shrink-0">
          <Download className="w-4 h-4" />
          Descargar
        </button>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          loading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner className="w-8 h-8 text-primary-500" />
            <p className="text-sm text-gray-500">Procesando archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className={clsx('w-10 h-10', isDragActive ? 'text-primary-500' : 'text-gray-400')} />
            {acceptedFiles.length > 0 ? (
              <p className="text-sm font-medium text-primary-700">{acceptedFiles[0].name}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo CSV aquí'}
                </p>
                <p className="text-xs text-gray-400">o haz clic para seleccionar &mdash; .csv, .txt (máx. 10 MB)</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <Alert type="error" message={error} />}
      {result && <ImportResultPanel result={result} />}

      {/* Format guide */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Formato del archivo CSV</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Columna', 'Requerido', 'Formato', 'Ejemplo'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Nombre', 'Sí', 'Texto', 'Juan'],
                ['Apellido', 'Sí', 'Texto', 'García'],
                ['FechaNacimiento', 'No', 'dd/MM/yyyy', '15/03/1985'],
                ['FechaGraduacion', 'Sí', 'dd/MM/yyyy', '01/04/2026'],
                ['OD_Esfera / OI_Esfera', 'No', 'Decimal (+/-)', '-1.75'],
                ['OD_Cilindro / OI_Cilindro', 'No', 'Decimal (+/-)', '-0.50'],
                ['OD_Eje / OI_Eje', 'No', 'Entero 0–180', '170'],
                ['OD_Adicion / OI_Adicion', 'No', 'Decimal', '+2.00'],
                ['OD_AV / OI_AV', 'No', 'Texto', '20/20'],
                ['DistanciaPupilar', 'No', 'Decimal', '62.5'],
                ['Optometrista', 'No', 'Texto', 'Dra. López'],
                ['Observaciones', 'No', 'Texto', 'Revisión anual'],
              ].map(([col, req, fmt, ex]) => (
                <tr key={col}>
                  <td className="px-3 py-1.5 font-mono text-primary-700">{col}</td>
                  <td className="px-3 py-1.5 text-gray-600">{req}</td>
                  <td className="px-3 py-1.5 text-gray-600">{fmt}</td>
                  <td className="px-3 py-1.5 text-gray-500">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Pegar Tab ────────────────────────────────────────────────────────────────

function PegarTab() {
  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [parsed, setParsed] = useState<ParsedRowPreview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    const rows = parseTexto(texto);
    setParsed(rows);
    setResult(null);
    setError('');
  };

  const handleImport = async () => {
    if (!parsed || parsed.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const filas = parsed.map(toImportRow);
      const data = await importarApi.importarPegar(fecha, filas);
      setResult(data);
      setParsed(null);
      setTexto('');
    } catch (e: any) {
      setError(e.message || 'Error al importar.');
    } finally {
      setLoading(false);
    }
  };

  const conError = parsed?.filter(r => r.error).length ?? 0;
  const validos = parsed ? parsed.length - conError : 0;

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500">
        Pega el contenido directamente desde Excel. Cada fila debe tener el nombre del paciente seguido de la graduación.
        El sistema detectará al paciente existente o lo creará si no existe.
      </div>

      {/* Format example */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Formato esperado por línea:</p>
        <pre className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap">{`Alejandra Escoto    OD-0.25=-1.50X170°  OI-1.75X165°
Porfirio Sanchez Caldero    OD-0.25  OI-0.25
Victor Gamboa    OD+4.00=-2.00X35°  OI+4.00=-3.50X120° ADD+3.00
Maria Isabel Jimenez    od-1.75x180°  oi-1.75x180°
Patricia Ramon    ODLENTE BLANDO TORICO`}</pre>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Datos a importar</label>
        <textarea
          value={texto}
          onChange={e => { setTexto(e.target.value); setParsed(null); setResult(null); }}
          rows={8}
          placeholder="Pega aquí el contenido desde Excel..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
        />
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Fecha de graduación:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      <button
        onClick={handleParse}
        disabled={!texto.trim()}
        className="btn-secondary"
      >
        Previsualizar
      </button>

      {/* Preview table */}
      {parsed && parsed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">{parsed.length} filas detectadas</span>
            {conError > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                {conError} con advertencia
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['#', 'Nombre', 'OD', 'OI', 'ADD', 'Notas'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsed.map((row, i) => (
                  <tr key={i} className={clsx(row.error && 'bg-amber-50')}>
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{row.nombreCompleto}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">{formatOjoPreview(row.od)}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">{formatOjoPreview(row.oi)}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">
                      {row.adicion != null
                        ? (row.adicion >= 0 ? `+${row.adicion.toFixed(2)}` : row.adicion.toFixed(2))
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {row.error
                        ? <span className="text-amber-600">{row.error}</span>
                        : row.observaciones
                          ? <span className="italic">{row.observaciones}</span>
                          : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={loading || validos === 0}
              className="btn-primary flex items-center gap-2"
            >
              {loading && <Spinner className="w-4 h-4" />}
              <CheckCircle2 className="w-4 h-4" />
              Importar {validos} registro{validos !== 1 ? 's' : ''}
            </button>
            <button onClick={() => { setParsed(null); }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {parsed && parsed.length === 0 && (
        <Alert type="error" message="No se detectaron filas válidas. Revisa el formato del texto." />
      )}

      {error && !parsed && <Alert type="error" message={error} />}
      {result && <ImportResultPanel result={result} />}
    </div>
  );
}

// ─── Xlsx Tab ─────────────────────────────────────────────────────────────────

const JOB_STORAGE_KEY = 'optica_import_jobId';

function XlsxTab() {
  const [sucursalId, setSucursalId] = useState<number | ''>('');
  const [optometristaId, setOptometristaId] = useState<number | ''>('');
  const [jobId, setJobId] = useState<string | null>(() => localStorage.getItem(JOB_STORAGE_KEY));
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: () => sucursalesApi.getAll(),
  });

  const { data: optometristas } = useQuery({
    queryKey: ['optometristas', sucursalId],
    queryFn: () => optometristasApi.getAll(sucursalId || undefined),
    enabled: !!sucursalId,
  });

  // Al montar, si hay un jobId en localStorage reanuda el polling inmediatamente
  const saveJobId = (id: string | null) => {
    setJobId(id);
    if (id) localStorage.setItem(JOB_STORAGE_KEY, id);
    else localStorage.removeItem(JOB_STORAGE_KEY);
  };

  // Polling de estado del job
  useEffect(() => {
    if (!jobId) return;
    if (jobStatus?.estado === 'completado' || jobStatus?.estado === 'error') return;

    const poll = async () => {
      try {
        const status = await importarApi.getJobStatus(jobId);
        setJobStatus(status);
        if (status.estado === 'procesando') {
          pollRef.current = setTimeout(poll, 1500);
        } else {
          // Job finalizado — limpiar localStorage
          if (status.estado === 'completado' || status.estado === 'error') {
            localStorage.removeItem(JOB_STORAGE_KEY);
          }
        }
      } catch {
        pollRef.current = setTimeout(poll, 3000);
      }
    };

    pollRef.current = setTimeout(poll, 500);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [jobId, jobStatus?.estado]);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!sucursalId) { setError('Selecciona una sucursal antes de importar.'); return; }

    setUploading(true);
    setError('');
    setJobStatus(null);
    saveJobId(null);

    try {
      const res = await importarApi.startXlsxImport(
        file,
        sucursalId || undefined,
        optometristaId || undefined,
      );
      saveJobId(res.jobId);
      setJobStatus({
        id: res.jobId,
        estado: 'procesando',
        total: res.total,
        procesados: 0,
        importados: 0,
        pacientesNuevos: 0,
        pacientesExistentes: 0,
        errores: [],
        inicio: new Date().toISOString(),
        porcentajeCompletado: 0,
      });
    } catch (e: any) {
      setError(e.message || 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  }, [sucursalId, optometristaId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    disabled: uploading || !!jobId,
  });

  const resetJob = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    saveJobId(null);
    setJobStatus(null);
    setError('');
  };

  const pct = jobStatus?.porcentajeCompletado ?? 0;
  const isRunning = jobStatus?.estado === 'procesando';
  const isDone = jobStatus?.estado === 'completado';
  const isError = jobStatus?.estado === 'error';

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500">
        Carga masiva desde Excel (.xlsx). El archivo debe tener: columna A = nombre completo
        del paciente, columna B = prescripción (formato OD/OI). La importación corre en
        segundo plano y podés seguir usando la app.
      </div>

      {/* Sucursal y Optometrista */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="inline w-3.5 h-3.5 mr-1" />
            Sucursal <span className="text-red-500">*</span>
          </label>
          <select
            value={sucursalId}
            onChange={e => { setSucursalId(Number(e.target.value) || ''); setOptometristaId(''); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">— Seleccionar sucursal —</option>
            {sucursales?.filter(s => s.activo).map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <UserCheck className="inline w-3.5 h-3.5 mr-1" />
            Optometrista
          </label>
          <select
            value={optometristaId}
            onChange={e => setOptometristaId(Number(e.target.value) || '')}
            disabled={!sucursalId}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">— Seleccionar optometrista —</option>
            {optometristas?.filter(o => o.activo).map(o => (
              <option key={o.id} value={o.id}>{o.nombre} {o.apellido}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dropzone */}
      {!jobId && (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
            (uploading || !!jobId) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 text-primary-500" />
              <p className="text-sm text-gray-500">Subiendo archivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <FileSpreadsheet className={clsx('w-12 h-12', isDragActive ? 'text-primary-500' : 'text-gray-400')} />
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo .xlsx aquí'}
              </p>
              <p className="text-xs text-gray-400">o haz clic para seleccionar — máx. 50 MB</p>
            </div>
          )}
        </div>
      )}

      {error && <Alert type="error" message={error} />}

      {/* Panel de progreso */}
      {jobStatus && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              {isRunning && <Spinner className="w-4 h-4 text-primary-500" />}
              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {isError && <XCircle className="w-4 h-4 text-red-500" />}
              {isRunning ? 'Importando...' : isDone ? 'Importación completada' : 'Error en la importación'}
            </h3>
            <span className="text-xs text-gray-400 font-mono">JOB: {jobStatus.id}</span>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{jobStatus.procesados.toLocaleString()} de {jobStatus.total.toLocaleString()} filas</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={clsx(
                  'h-3 rounded-full transition-all duration-500',
                  isDone ? 'bg-emerald-500' : isError ? 'bg-red-400' : 'bg-primary-500'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Importados', value: jobStatus.importados, color: 'text-emerald-700' },
              { label: 'Pacientes nuevos', value: jobStatus.pacientesNuevos, color: 'text-primary-700' },
              { label: 'Pacientes existentes', value: jobStatus.pacientesExistentes, color: 'text-gray-700' },
              { label: 'Errores', value: jobStatus.errores.length, color: jobStatus.errores.length > 0 ? 'text-red-600' : 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className={clsx('text-xl font-bold', color)}>{value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Errores individuales */}
          {jobStatus.errores.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50">
              {jobStatus.errores.map((e, i) => (
                <div key={i} className="px-3 py-1.5 text-xs text-red-600">{e}</div>
              ))}
            </div>
          )}

          {(isDone || isError) && (
            <button onClick={resetJob} className="btn-secondary">
              Nueva importación
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared result panel ──────────────────────────────────────────────────────

function ImportResultPanel({ result }: { result: ImportResult }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="font-semibold text-gray-800">Resultado de la importación</h3>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total filas', value: result.totalFilas, color: 'text-gray-700' },
          { label: 'Importados', value: result.importados, color: 'text-emerald-700' },
          { label: 'Con errores', value: result.omitidos, color: result.omitidos > 0 ? 'text-red-700' : 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
            <p className={clsx('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {result.importados === result.totalFilas && result.errores.length === 0 && (
        <Alert type="success" message={`¡Importación exitosa! ${result.importados} registros procesados.`} />
      )}

      {result.errores.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Errores encontrados ({result.errores.length})
          </p>
          <div className="max-h-56 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50">
            {result.errores.map((e, i) => (
              <div key={i} className="px-3 py-2 text-xs">
                <span className="font-medium text-red-600">Fila {e.fila} · {e.columna}:</span>{' '}
                <span className="text-red-500">{e.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'xlsx' | 'pegar' | 'csv';

export default function ImportPage() {
  const [tab, setTab] = useState<Tab>('xlsx');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'xlsx', label: 'Excel masivo (.xlsx)', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'pegar', label: 'Pegar desde Excel', icon: <ClipboardPaste className="w-4 h-4" /> },
    { id: 'csv', label: 'Archivo CSV', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Importar graduaciones</h2>
        <p className="text-sm text-gray-500 mt-1">
          Carga masiva desde Excel, pegado rápido, o archivo CSV estructurado.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'xlsx' && <XlsxTab />}
      {tab === 'pegar' && <PegarTab />}
      {tab === 'csv' && <CsvTab />}
    </div>
  );
}
