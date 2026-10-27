'use client';

import { useEffect, useRef, useState } from 'react';
import { TicketPercent, X } from 'lucide-react';
import { validarCupon } from '@/lib/combos';

const campo = 'flex-1 min-w-0 bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm uppercase tracking-wider outline-none focus:border-brand-500 disabled:opacity-50';

/**
 * Campo de cupón. onChange({ code, descuento } | null). El servidor vuelve a validar al cobrar;
 * aquí solo se muestra la vista previa y se revalida si cambian los montos.
 * bloqueado: texto que explica por qué no se puede usar (promoción o combo activos).
 */
export default function CuponInput({ subBoletos, subComida, guestEmail, onChange, bloqueado }) {
  const [texto, setTexto] = useState('');
  const [aplicado, setAplicado] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const aviso = useRef(onChange);
  aviso.current = onChange;

  const aplicar = async (code, silencioso = false) => {
    setCargando(true); if (!silencioso) setError('');
    try {
      const r = await validarCupon(code, subBoletos, subComida, guestEmail);
      const nuevo = { code: r.code, descuento: r.descuento };
      setAplicado(nuevo); aviso.current?.(nuevo);
    } catch (e) {
      setAplicado(null); aviso.current?.(null); setError(e.message);
    } finally { setCargando(false); }
  };

  // Si cambian boletos o comida, el descuento se recalcula (o se quita si ya no aplica)
  useEffect(() => { if (aplicado) aplicar(aplicado.code, true); /* eslint-disable-next-line */ }, [subBoletos, subComida]);
  // Si otra opción bloquea el cupón, se quita
  useEffect(() => { if (bloqueado && aplicado) { setAplicado(null); aviso.current?.(null); } }, [bloqueado, aplicado]);

  const quitar = () => { setAplicado(null); aviso.current?.(null); setTexto(''); setError(''); };

  if (bloqueado) return <p className="text-[11px] text-neutral-500 flex items-center gap-1.5"><TicketPercent size={13} /> {bloqueado}</p>;
  if (aplicado) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">
        <span className="text-emerald-300 flex items-center gap-1.5"><TicketPercent size={14} /> Cupón <b>{aplicado.code}</b>: −Q{aplicado.descuento.toFixed(2)}</span>
        <button onClick={quitar} aria-label="Quitar cupón" className="text-neutral-400 hover:text-white"><X size={14} /></button>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input value={texto} onChange={(e) => { setTexto(e.target.value); setError(''); }} placeholder="¿Tienes un cupón?" aria-label="Código de cupón" maxLength={30}
          onKeyDown={(e) => { if (e.key === 'Enter' && texto.trim()) { e.preventDefault(); aplicar(texto); } }} className={campo} />
        <button type="button" disabled={cargando || !texto.trim()} onClick={() => aplicar(texto)}
          className="px-3 rounded-lg border border-purple-600/60 text-purple-200 text-xs font-bold uppercase tracking-wider hover:bg-purple-950/30 disabled:opacity-40">{cargando ? '...' : 'Aplicar'}</button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
