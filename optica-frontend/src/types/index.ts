export interface Ojo {
  esfera?: number | null;
  cilindro?: number | null;
  eje?: number | null;
  adicion?: number | null;
  av?: string | null;
}

export interface Optica {
  id: number;
  nombre: string;
  razonSocial?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface Sucursal {
  id: number;
  opticaId: number;
  nombreOptica: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface Optometrista {
  id: number;
  sucursalId: number;
  nombreSucursal: string;
  nombre: string;
  apellido: string;
  cedula?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
  fechaCreacion: string;
  totalGraduaciones: number;
}

export interface PacienteForm {
  nombre: string;
  apellido: string;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface Graduacion {
  id: number;
  pacienteId: number;
  nombrePaciente: string;
  apellidoPaciente: string;
  fecha: string;
  ojoDerecho: Ojo;
  ojoIzquierdo: Ojo;
  distanciaPupilar?: number | null;
  observaciones?: string | null;
  optometrista?: string | null;
  sucursalId?: number | null;
  nombreSucursal?: string | null;
  optometristaId?: number | null;
  nombreOptometrista?: string | null;
  venta: boolean;
  material?: string | null;
  disenoLente?: string | null;
  tratamiento?: string | null;
}

export interface GraduacionForm {
  pacienteId: number;
  fecha: string;
  ojoDerecho: Ojo;
  ojoIzquierdo: Ojo;
  distanciaPupilar?: number | null;
  observaciones?: string | null;
  optometrista?: string | null;
  sucursalId?: number | null;
  optometristaId?: number | null;
  venta?: boolean;
  material?: string | null;
  disenoLente?: string | null;
  tratamiento?: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ExpedienteMedico {
  ocupacion?: string | null;
  alergias?: string | null;
  enfermedadesSistemicas?: string | null;
  medicamentosActuales?: string | null;
  antecedentesFamiliares?: string | null;
  observaciones?: string | null;
  fechaActualizacion?: string;
}

export interface ImportPegarRow {
  nombreCompleto: string;
  oD_Esfera?: number | null;
  oD_Cilindro?: number | null;
  oD_Eje?: number | null;
  oI_Esfera?: number | null;
  oI_Cilindro?: number | null;
  oI_Eje?: number | null;
  adicion?: number | null;
  observaciones?: string | null;
}

export interface ImportJobStatus {
  id: string;
  estado: 'procesando' | 'completado' | 'error';
  total: number;
  procesados: number;
  importados: number;
  pacientesNuevos: number;
  pacientesExistentes: number;
  errores: string[];
  inicio: string;
  fin?: string;
  porcentajeCompletado: number;
}

export interface ImportResult {
  totalFilas: number;
  importados: number;
  omitidos: number;
  errores: ImportRowError[];
}

export interface ImportRowError {
  fila: number;
  columna: string;
  mensaje: string;
}
