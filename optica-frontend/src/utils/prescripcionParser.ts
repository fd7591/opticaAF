import type { ImportPegarRow } from '../types';

interface ParsedOjo {
  esfera: number | null;
  cilindro: number | null;
  eje: number | null;
  textoLibre?: string;
}

export interface ParsedRowPreview {
  nombreCompleto: string;
  od: ParsedOjo;
  oi: ParsedOjo;
  adicion: number | null;
  observaciones: string | null;
  raw: string;
  error?: string;
}

function parseOjoStr(text: string): ParsedOjo {
  const s = text.trim();
  if (!s) return { esfera: null, cilindro: null, eje: null };

  // Pattern: esfera=cilindroxeje  (e.g. -0.25=-1.50X170)
  const fullMatch = s.match(/^([+-]?\d+(?:\.\d+)?)=([+-]?\d+(?:\.\d+)?)X(\d+)/i);
  if (fullMatch) {
    return {
      esfera: parseFloat(fullMatch[1]),
      cilindro: parseFloat(fullMatch[2]),
      eje: parseInt(fullMatch[3]),
    };
  }

  // Pattern: esfera+xeje  (e.g. -1.75X180)
  const esferaEjeMatch = s.match(/^([+-]?\d+(?:\.\d+)?)X(\d+)/i);
  if (esferaEjeMatch) {
    return {
      esfera: parseFloat(esferaEjeMatch[1]),
      cilindro: null,
      eje: parseInt(esferaEjeMatch[2]),
    };
  }

  // Pattern: solo esfera  (e.g. -0.25)
  const esferaMatch = s.match(/^([+-]?\d+(?:\.\d+)?)$/);
  if (esferaMatch) {
    return { esfera: parseFloat(esferaMatch[1]), cilindro: null, eje: null };
  }

  // Texto libre (e.g. "LENTE BLANDO TORICO")
  return { esfera: null, cilindro: null, eje: null, textoLibre: s };
}

function parsePrescripcion(text: string): {
  od: ParsedOjo;
  oi: ParsedOjo;
  adicion: number | null;
  observaciones: string | null;
} {
  const upper = text.toUpperCase();

  // Extraer ADD
  const addMatch = upper.match(/ADD\s*([+-]?\d+(?:\.\d+)?)/);
  const adicion = addMatch ? parseFloat(addMatch[1]) : null;
  const addIdx = addMatch ? upper.indexOf(addMatch[0]) : -1;

  // Buscar posiciones de OD y OI
  const odIdx = upper.indexOf('OD');
  const oiIdx = upper.indexOf('OI');

  let odStr = '';
  let oiStr = '';

  if (odIdx >= 0 && oiIdx >= 0 && odIdx < oiIdx) {
    odStr = upper.substring(odIdx + 2, oiIdx).trim();
    const oiEnd = addIdx > oiIdx ? addIdx : upper.length;
    oiStr = upper.substring(oiIdx + 2, oiEnd).trim();
  } else if (odIdx >= 0) {
    const odEnd = addIdx >= 0 ? addIdx : upper.length;
    odStr = upper.substring(odIdx + 2, odEnd).trim();
  } else if (oiIdx >= 0) {
    const oiEnd = addIdx >= 0 ? addIdx : upper.length;
    oiStr = upper.substring(oiIdx + 2, oiEnd).trim();
  }

  const od = parseOjoStr(odStr);
  const oi = parseOjoStr(oiStr);

  const obs = od.textoLibre || oi.textoLibre
    ? [od.textoLibre, oi.textoLibre].filter(Boolean).join(' / ')
    : null;

  return { od, oi, adicion, observaciones: obs };
}

export function parseLine(line: string): ParsedRowPreview | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Separar nombre de prescripción: tab o 2+ espacios consecutivos
  let nombre = '';
  let prescText = '';

  const tabIdx = trimmed.indexOf('\t');
  if (tabIdx >= 0) {
    nombre = trimmed.substring(0, tabIdx).trim();
    prescText = trimmed.substring(tabIdx + 1).trim();
  } else {
    // 2+ espacios como separador
    const match = trimmed.match(/^(.+?)\s{2,}(\S.*)$/);
    if (match) {
      nombre = match[1].trim();
      prescText = match[2].trim();
    } else {
      // Sin separador claro: toda la línea es el nombre, sin prescripción
      nombre = trimmed;
      prescText = '';
    }
  }

  if (!nombre) return null;

  // Si no hay prescripción válida
  if (!prescText || !/OD|OI/i.test(prescText)) {
    return {
      nombreCompleto: nombre,
      od: { esfera: null, cilindro: null, eje: null },
      oi: { esfera: null, cilindro: null, eje: null },
      adicion: null,
      observaciones: prescText || null,
      raw: trimmed,
      error: prescText ? undefined : 'Sin prescripción',
    };
  }

  const { od, oi, adicion, observaciones } = parsePrescripcion(prescText);

  return { nombreCompleto: nombre, od, oi, adicion, observaciones, raw: trimmed };
}

export function parseTexto(texto: string): ParsedRowPreview[] {
  return texto
    .split('\n')
    .map(parseLine)
    .filter((r): r is ParsedRowPreview => r !== null);
}

export function toImportRow(row: ParsedRowPreview): ImportPegarRow {
  return {
    nombreCompleto: row.nombreCompleto,
    oD_Esfera: row.od.esfera,
    oD_Cilindro: row.od.cilindro,
    oD_Eje: row.od.eje,
    oI_Esfera: row.oi.esfera,
    oI_Cilindro: row.oi.cilindro,
    oI_Eje: row.oi.eje,
    adicion: row.adicion,
    observaciones: row.observaciones,
  };
}

export function formatOjoPreview(od: ParsedOjo): string {
  if (od.textoLibre) return od.textoLibre;
  if (od.esfera == null) return '—';
  const esf = od.esfera >= 0 ? `+${od.esfera.toFixed(2)}` : od.esfera.toFixed(2);
  if (od.cilindro != null && od.eje != null) {
    const cil = od.cilindro >= 0 ? `+${od.cilindro.toFixed(2)}` : od.cilindro.toFixed(2);
    return `${esf}=${cil}X${od.eje}°`;
  }
  if (od.eje != null) return `${esf}X${od.eje}°`;
  return esf;
}
