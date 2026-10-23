'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { imprimirVenta, leerReciboPref, guardarReciboPref } from '@/lib/imprimir';

// Imprime los tickets de una venta en la impresora térmica (80 mm). `cargar` permite traer la venta completa al hacer clic.
export default function BotonImprimir({ venta, cargar, className = '', conOpcion = true }) {
  const [recibo, setRecibo] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setRecibo(leerReciboPref()), []);

  const clic = async () => {
    setError(''); setImprimiendo(true);
    try { await imprimirVenta(cargar ? await cargar() : venta, { recibo }); }
    catch (e) { setError(e.message); }
    finally { setImprimiendo(false); }
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-3">
        <button onClick={clic} disabled={imprimiendo}
          className={className || 'flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-700 text-xs font-bold uppercase tracking-wider hover:border-white disabled:opacity-50'}>
          <Printer size={14} /> {imprimiendo ? 'Preparando...' : 'Imprimir tickets'}
        </button>
        {conOpcion && (
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={recibo} onChange={(e) => { setRecibo(e.target.checked); guardarReciboPref(e.target.checked); }} /> con recibo
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
