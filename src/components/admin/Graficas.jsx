'use client';

import { useState } from 'react';

export const Q = (n) => `Q${Number(n ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const pct = (n, d = 0) => `${(Number(n ?? 0) * 100).toFixed(d)}%`;

export function Tarjeta({ label, valor, sub, destacado, alerta }) {
  const estilo = destacado ? 'bg-gradient-to-tr from-purple-700/40 to-fuchsia-600/30 border-purple-500/40'
    : alerta ? 'bg-amber-950/20 border-amber-700/40' : 'bg-[#121318] border-neutral-800/80';
  return (
    <div className={`rounded-xl p-4 border ${estilo}`}>
      <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">{label}</p>
      <p className="text-xl md:text-2xl font-black mt-1.5 tabular-nums">{valor}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

export function Seccion({ titulo, derecha, children }) {
  return (
    <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5 min-w-0">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">{titulo}</h2>
        {derecha}
      </div>
      {children}
    </section>
  );
}

// Barras por día (SVG, sin librerías). `detalle` arma el texto del cursor.
export function BarrasDia({ datos, valor, detalle, etiqueta = 'Ingresos por día' }) {
  const [activo, setActivo] = useState(null);
  const max = Math.max(1, ...datos.map(valor));
  const W = 640, H = 160, gap = datos.length > 45 ? 1 : 4;
  const bw = Math.max(1, (W - gap * (datos.length - 1)) / datos.length);
  const paso = Math.ceil(datos.length / 14);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label={etiqueta}>
        {[0.25, 0.5, 0.75, 1].map((p) => <line key={p} x1="0" x2={W} y1={H - H * p} y2={H - H * p} stroke="#2a2b33" strokeDasharray="3 4" />)}
        {datos.map((d, i) => {
          const h = (valor(d) / max) * H;
          return (
            <g key={d.dia} onMouseEnter={() => setActivo(d)} onMouseLeave={() => setActivo(null)}>
              <rect x={i * (bw + gap)} y={0} width={bw + gap} height={H} fill="transparent" />
              <rect x={i * (bw + gap)} y={H - Math.max(h, 2)} width={bw} height={Math.max(h, 2)} rx={bw > 4 ? 3 : 0} fill={activo?.dia === d.dia ? '#d946ef' : '#9333ea'} opacity={valor(d) ? 1 : 0.25} />
              {i % paso === 0 && <text x={i * (bw + gap) + bw / 2} y={H + 15} textAnchor="middle" fontSize="9" fill="#8b8d98">{d.dia.slice(8)}/{d.dia.slice(5, 7)}</text>}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-neutral-400 h-5 mt-1">{activo ? detalle(activo) : 'Pasa el cursor sobre una barra para ver el detalle'}</p>
    </div>
  );
}

export function ListaBarras({ items, etiqueta, valor, formato, vacio = 'Sin datos en este periodo.' }) {
  const max = Math.max(1e-9, ...items.map(valor));
  if (items.length === 0) return <p className="text-sm text-gray-500">{vacio}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={etiqueta(it)}>
          <div className="flex justify-between text-sm gap-3"><span className="truncate">{etiqueta(it)}</span><span className="font-bold flex-shrink-0 tabular-nums">{formato(it)}</span></div>
          <div className="h-2 rounded-full bg-neutral-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500" style={{ width: `${(valor(it) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

const DIAS = [['Lun', 1], ['Mar', 2], ['Mié', 3], ['Jue', 4], ['Vie', 5], ['Sáb', 6], ['Dom', 0]];

// Mapa de calor: boletos por día de la semana y hora de la función (el número va dentro de la celda: no depende solo del color)
export function MapaHorarios({ datos }) {
  if (datos.length === 0) return <p className="text-sm text-gray-500">Sin boletos en este periodo.</p>;
  const horas = [];
  const minH = Math.min(...datos.map((d) => d.hora)), maxH = Math.max(...datos.map((d) => d.hora));
  for (let h = minH; h <= maxH; h++) horas.push(h);
  const mapa = new Map(datos.map((d) => [`${d.dow}-${d.hora}`, d.boletos]));
  const max = Math.max(...datos.map((d) => d.boletos));
  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] border-separate border-spacing-1 mx-auto" aria-label="Boletos por día y hora">
        <thead><tr><th />{horas.map((h) => <th key={h} className="text-neutral-500 font-normal w-9">{h}h</th>)}</tr></thead>
        <tbody>
          {DIAS.map(([n, dow]) => (
            <tr key={dow}>
              <th className="text-neutral-400 font-normal text-right pr-1">{n}</th>
              {horas.map((h) => {
                const v = mapa.get(`${dow}-${h}`) ?? 0;
                return (
                  <td key={h} title={`${n} ${h}:00 · ${v} boleto(s)`} className="h-8 w-9 rounded text-center tabular-nums"
                    style={{ background: v ? `rgba(147,51,234,${0.18 + 0.82 * (v / max)})` : '#16171d', color: v / max > 0.5 ? '#fff' : '#c4b5fd' }}>
                    {v || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
