import { Printer } from 'lucide-react';
import type { Graduacion, Ojo } from '../../types';

function fmtNum(v: number | null | undefined): string | null {
  if (v == null) return null;
  return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
}

function formatOjo(ojo: Ojo | undefined, lado: 'OD' | 'OI'): string {
  const esfera = fmtNum(ojo?.esfera);
  if (!esfera) return '';

  let result = `${lado}${esfera}`;
  if (ojo?.cilindro != null && ojo?.eje != null) {
    result += `=${fmtNum(ojo.cilindro)}X${ojo.eje}°`;
  } else if (ojo?.eje != null) {
    result += `X${ojo.eje}°`;
  }
  return result;
}

export function formatReceta(grad: Graduacion): string {
  const od = formatOjo(grad.ojoDerecho, 'OD');
  const oi = formatOjo(grad.ojoIzquierdo, 'OI');
  const adicion = grad.ojoDerecho?.adicion ?? grad.ojoIzquierdo?.adicion;
  const add = adicion != null ? `  ADD${fmtNum(adicion)}` : '';
  const partes = [od, oi].filter(Boolean);
  return partes.join('    ') + add;
}

interface Props {
  nombre: string;
  apellido: string;
  grad: Graduacion;
}

export default function RecetaLabel({ nombre, apellido, grad }: Props) {
  const receta = formatReceta(grad);

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=520,height=220');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; padding: 24px 28px; }
    .nombre { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .receta { font-size: 13px; letter-spacing: 0.3px; }
  </style>
</head>
<body>
  <div class="nombre">${apellido}, ${nombre}</div>
  <div class="receta">${receta}</div>
  <script>setTimeout(function(){ window.print(); window.close(); }, 100);</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 font-mono">
        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">
          {apellido}, {nombre}
        </p>
        <p className="text-sm text-gray-800 tracking-wide">{receta}</p>
      </div>
      <div className="flex justify-end">
        <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>
    </div>
  );
}
