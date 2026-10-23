'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const Q = (n) => `Q${Number(n ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Tarjeta({ label, valor, sub, destacado }) {
  return (
    <div className={`rounded-xl p-5 border ${destacado ? 'bg-gradient-to-tr from-purple-700/40 to-fuchsia-600/30 border-purple-500/40' : 'bg-[#121318] border-neutral-800/80'}`}>
      <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">{label}</p>
      <p className="text-2xl md:text-3xl font-black mt-2">{valor}</p>
      {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

// Gráfica de barras (ingresos por día) en SVG, sin librerías
function BarrasDia({ datos }) {
  const [activo, setActivo] = useState(null);
  const max = Math.max(1, ...datos.map((d) => d.ingresos));
  const W = 560, H = 160, gap = 6;
  const bw = (W - gap * (datos.length - 1)) / datos.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label="Ingresos por día">
        {[0.25, 0.5, 0.75, 1].map((p) => <line key={p} x1="0" x2={W} y1={H - H * p} y2={H - H * p} stroke="#2a2b33" strokeDasharray="3 4" />)}
        {datos.map((d, i) => {
          const h = (d.ingresos / max) * H;
          return (
            <g key={d.dia} onMouseEnter={() => setActivo(d)} onMouseLeave={() => setActivo(null)}>
              <rect x={i * (bw + gap)} y={0} width={bw} height={H} fill="transparent" />
              <rect x={i * (bw + gap)} y={H - Math.max(h, 2)} width={bw} height={Math.max(h, 2)} rx="3" fill={activo?.dia === d.dia ? '#d946ef' : '#9333ea'} opacity={d.ingresos ? 1 : 0.25} />
              {(i % 2 === 0 || datos.length <= 8) && <text x={i * (bw + gap) + bw / 2} y={H + 15} textAnchor="middle" fontSize="9" fill="#8b8d98">{d.dia.slice(8)}/{d.dia.slice(5, 7)}</text>}
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-neutral-400 h-5 mt-1">{activo ? `${activo.dia}: ${Q(activo.ingresos)} · ${activo.ventas} venta(s)` : 'Pasa el cursor sobre una barra para ver el detalle'}</p>
    </div>
  );
}

function ListaBarras({ items, etiqueta, valor, formato, vacio }) {
  const max = Math.max(1, ...items.map(valor));
  if (items.length === 0) return <p className="text-sm text-gray-500">{vacio}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={etiqueta(it)}>
          <div className="flex justify-between text-sm gap-3"><span className="truncate">{etiqueta(it)}</span><span className="font-bold flex-shrink-0">{formato(it)}</span></div>
          <div className="h-2 rounded-full bg-neutral-800 mt-1.5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500" style={{ width: `${(valor(it) / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

const ESTADOS = { paid: 'Pagadas', pending: 'Pendientes', expired: 'Vencidas', cancelled: 'Canceladas' };

export default function AdminResumen() {
  const [s, setS] = useState(null);
  const [dias, setDias] = useState(14);
  const [error, setError] = useState('');

  useEffect(() => {
    setS(null);
    api(`/stats/resumen?dias=${dias}`).then(setS).catch((e) => setError(e.message));
  }, [dias]);

  const totalDias = useMemo(() => (s ? s.ventasPorDia.reduce((a, d) => a + d.ingresos, 0) : 0), [s]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!s) return <p className="text-gray-400">Cargando estadísticas...</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Resumen</h1>
        <div className="flex gap-1 bg-[#121318] border border-neutral-800 rounded-lg p-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDias(d)} className={`px-3 py-1 rounded-md text-xs font-bold ${dias === d ? 'bg-purple-600' : 'text-neutral-400 hover:text-white'}`}>{d} días</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta destacado label="Ingresos (pagadas)" valor={Q(s.totales.ingresos)} sub={`${s.totales.ventasPagadas} ventas${s.totales.ingresosTaquilla ? ` · taquilla ${Q(s.totales.ingresosTaquilla)}` : ''}`} />
        <Tarjeta label="Boletos vendidos" valor={s.boletos.total} sub={`${s.boletos.usados} ya usados en sala`} />
        <Tarjeta label="Pendientes de pago" valor={s.totales.pendientes} sub={s.totales.reembolsos ? `${s.totales.reembolsos} reembolso(s) · ${Q(s.totales.montoReembolsado)}` : undefined} />
        <Tarjeta label="Clientes" valor={s.totales.clientes} />
      </div>

      <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Ingresos por día</h2>
          <span className="text-sm font-bold">{Q(totalDias)} <span className="text-neutral-500 font-normal">en {dias} días</span></span>
        </div>
        <BarrasDia datos={s.ventasPorDia} />
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-4">Películas más vendidas</h2>
          <ListaBarras items={s.topPeliculas} etiqueta={(p) => p.title} valor={(p) => p.boletos} formato={(p) => `${p.boletos} boletos · ${Q(p.ingresos)}`} vacio="Aún no hay ventas pagadas." />
        </section>
        <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-4">Comida más vendida</h2>
          <ListaBarras items={s.topComida} etiqueta={(c) => c.name} valor={(c) => c.unidades} formato={(c) => `${c.unidades} uds · ${Q(c.ingresos)}`} vacio="Aún no hay ventas de comida." />
        </section>
        <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-4">Ocupación de próximas funciones</h2>
          <ListaBarras items={s.ocupacion} etiqueta={(o) => `${o.title} · ${new Date(o.showDatetime).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`}
            valor={(o) => (o.capacidad ? o.vendidos / o.capacidad : 0)} formato={(o) => `${o.vendidos}/${o.capacidad}`} vacio="No hay funciones próximas." />
        </section>
        <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-4">Ventas por estado</h2>
          <ListaBarras items={s.porEstado} etiqueta={(e) => ESTADOS[e.status] ?? e.status} valor={(e) => e.total} formato={(e) => e.total} vacio="Sin ventas." />
        </section>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href="/admin/validar" className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-500 font-bold uppercase tracking-wider">Validar entradas</Link>
        <Link href="/admin/ventas" className="px-4 py-2 rounded-full border border-neutral-700 hover:border-white font-bold uppercase tracking-wider">Ver ventas</Link>
      </div>
    </div>
  );
}
