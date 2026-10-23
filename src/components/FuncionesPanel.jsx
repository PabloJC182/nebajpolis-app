'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Ticket } from 'lucide-react';
import { diaGT, TZ } from '@/lib/adapters';
import { useCine } from '@/lib/cine';

const etiquetaDia = (key) => {
  const d = new Date(`${key}T12:00:00-06:00`);
  const hoy = diaGT(new Date());
  const man = diaGT(new Date(Date.now() + 864e5));
  const corto = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
  return key === hoy ? `Hoy · ${d.getDate()}` : key === man ? `Mañana · ${d.getDate()}` : corto;
};

export default function FuncionesPanel({ funciones, vacio }) {
  const cines = useMemo(() => {
    const m = new Map();
    funciones.forEach((f) => f.cinema && m.set(f.cinemaId || f.cinema, f.cinema));
    return [...m.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [funciones]);
  const dias = useMemo(() => [...new Set(funciones.map((f) => f.dayKey))].sort(), [funciones]);

  const [cineGlobal] = useCine();
  const [cine, setCine] = useState('todos');
  // Si el visitante ya eligió un cine y esta película tiene funciones ahí, se muestra ese por defecto
  useEffect(() => { if (cineGlobal && cines.some((c) => c.id === cineGlobal)) setCine(cineGlobal); }, [cineGlobal, cines]);
  const [dia, setDia] = useState('todos');

  const visibles = funciones.filter((f) => (cine === 'todos' || (f.cinemaId || f.cinema) === cine) && (dia === 'todos' || f.dayKey === dia));
  const chip = (activo) => `px-3 py-1.5 rounded-full text-[11px] font-semibold border whitespace-nowrap transition-colors ${activo ? 'bg-purple-600 border-purple-500' : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-purple-500/60'}`;

  return (
    <div className="bg-[#121318]/90 border border-neutral-800 rounded-xl p-5 space-y-4">
      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Funciones</h2>

      {funciones.length === 0 && <p className="text-sm text-gray-500">{vacio ?? 'No hay funciones disponibles.'}</p>}

      {dias.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setDia('todos')} className={chip(dia === 'todos')}>Todos los días</button>
          {dias.map((d) => <button key={d} onClick={() => setDia(d)} className={chip(dia === d)}>{etiquetaDia(d)}</button>)}
        </div>
      )}
      {cines.length > 1 && (
        <select value={cine} onChange={(e) => setCine(e.target.value)} className="w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
          <option value="todos">Todos los cines</option>
          {cines.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      )}

      {funciones.length > 0 && visibles.length === 0 && <p className="text-sm text-gray-500">No hay funciones con ese filtro.</p>}

      <div className="space-y-2">
        {visibles.map((f) => (
          <Link key={f.id} href={`/funcion/${f.id}`} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#0D0E12] border border-neutral-800 hover:border-purple-500/50 transition-colors">
            <span className="flex flex-col">
              <span className="text-sm font-bold flex items-center gap-2"><Clock size={14} className="text-brand-400" />{f.time}<span className="text-gray-400 font-normal">· {f.date} {f.month}</span></span>
              <span className="text-[11px] text-gray-400 mt-0.5">{f.cinema} · {f.room}</span>
            </span>
            <span className="text-xs text-purple-300 flex items-center gap-1 text-right"><Ticket size={12} />{f.format} · {f.currency}{f.pricePerSeat}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
