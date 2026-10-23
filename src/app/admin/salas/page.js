'use client';

import { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const TIPOS = ['2D', '3D', 'IMAX', 'VIP', '4DX'].map((t) => ({ value: t, label: t }));
const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500';

// Vista previa de la cuadrícula que se va a generar
function Vista({ filas, porFila }) {
  const f = Math.min(Math.max(filas, 0), 26), n = Math.min(Math.max(porFila, 0), 40);
  if (!f || !n) return null;
  return (
    <div className="overflow-x-auto bg-[#0D0E12] border border-neutral-800 rounded-lg p-3">
      <div className="w-2/3 mx-auto h-1.5 rounded bg-neutral-600 mb-3" title="Pantalla" />
      <div className="flex flex-col gap-1 items-center min-w-max">
        {Array.from({ length: f }, (_, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-4 text-[9px] font-mono text-neutral-500">{String.fromCharCode(65 + i)}</span>
            {Array.from({ length: n }, (_, j) => <span key={j} className="w-2.5 h-2.5 rounded-sm bg-purple-500/70" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneradorAsientos({ sala, onCerrar, onListo }) {
  const [filas, setFilas] = useState(8);
  const [porFila, setPorFila] = useState(12);
  const [reemplazar, setReemplazar] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const tiene = Number(sala.seatCount) > 0;

  const generar = async () => {
    setEnviando(true); setError('');
    try {
      const r = await api(`/rooms/${sala.id}/generar-asientos`, { method: 'POST', body: json({ rows: Number(filas), seatsPerRow: Number(porFila), replace: reemplazar }) });
      onListo(r.message);
    } catch (e) { setError(e.message); setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121318] border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Asientos — {[sala.cinema?.name, sala.name].filter(Boolean).join(' · ')}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-white" aria-label="Cerrar"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Filas (A, B, C...)</label>
            <input className={campo} type="number" min="1" max="26" value={filas} onChange={(e) => setFilas(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Asientos por fila</label>
            <input className={campo} type="number" min="1" max="40" value={porFila} onChange={(e) => setPorFila(e.target.value)} />
          </div>
        </div>
        <p className="text-sm text-gray-300">Total: <b>{(Number(filas) || 0) * (Number(porFila) || 0)}</b> asientos</p>
        <Vista filas={Number(filas)} porFila={Number(porFila)} />
        {tiene && (
          <label className="flex items-start gap-2 text-sm text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg p-3">
            <input type="checkbox" className="mt-0.5" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} />
            <span>Esta sala ya tiene {sala.seatCount} asientos. Marca para <b>reemplazarlos</b> (no se puede si ya hay boletos vendidos).</span>
          </label>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={onCerrar} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider">Cancelar</button>
          <button disabled={enviando || (tiene && !reemplazar)} onClick={generar} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider disabled:opacity-40">
            {enviando ? 'Generando...' : 'Generar asientos'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [generando, setGenerando] = useState(null); // sala a la que se le generan asientos
  const ctx = useRef(null);

  const cfg = useMemo(() => ({
    titulo: 'Salas',
    listar: async () => { const r = await api('/rooms'); return Array.isArray(r) ? r : []; },
    columnas: [
      { label: 'Cine', render: (r) => r.cinema?.name ?? '—' },
      { label: 'Sala', render: (r) => <span className="font-semibold">{r.name}</span> },
      { label: 'Tipo', render: (r) => r.roomType },
      { label: 'Asientos', render: (r) => (Number(r.seatCount) > 0 ? r.seatCount : <span className="text-amber-400">Sin asientos</span>) },
    ],
    campos: [
      { name: 'cinemaId', label: 'Cine', type: 'select', required: true, cargar: async () => (await api('/cinemas')).map((c) => ({ value: c.id, label: c.name })) },
      { name: 'name', label: 'Nombre (Sala 1, Sala VIP...)', required: true },
      { name: 'roomType', label: 'Tipo', type: 'select', cargar: async () => TIPOS },
    ],
    vacio: () => ({ roomType: '2D' }),
    aFormulario: (r) => ({ cinemaId: r.cinemaId, name: r.name, roomType: r.roomType }),
    aPayload: (f) => ({ cinemaId: Number(f.cinemaId), name: f.name.trim(), roomType: f.roomType || '2D' }),
    // Al crear una sala se abre directo el generador de asientos
    crear: async (p) => { const r = await api('/rooms/create/', { method: 'POST', body: json(p) }); setGenerando({ ...r, seatCount: 0, cinema: null }); return r; },
    actualizar: (id, p) => api(`/rooms/update/${id}`, { method: 'PUT', body: json(p) }),
    eliminar: (id) => api(`/rooms/delete/${id}`, { method: 'DELETE' }),
    acciones: [{
      label: 'Asientos',
      mostrar: () => true,
      onClick: (r, c) => { ctx.current = c; setGenerando(r); },
    }],
  }), []);

  return (
    <>
      <CrudTable cfg={cfg} onContexto={(c) => { ctx.current = c; }} />
      {generando && (
        <GeneradorAsientos
          sala={generando}
          onCerrar={() => setGenerando(null)}
          onListo={(msg) => { setGenerando(null); ctx.current?.avisar?.(msg); ctx.current?.recargar?.(); }}
        />
      )}
    </>
  );
}
