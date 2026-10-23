'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { imprimirVenta, prepararImpresora, leerReciboPref, guardarReciboPref, leerModoPref, guardarModoPref } from '@/lib/imprimir';
import { usbSoportado, obtenerImpresora, imprimirPruebaUSB } from '@/lib/escpos';

// Imprime los tickets de una venta en la impresora térmica (80 mm). `cargar` permite traer la venta completa al hacer clic.
// Modo "navegador": diálogo de impresión (driver de Windows). Modo "USB directo": ESC/POS por WebUSB, sin driver.
export default function BotonImprimir({ venta, cargar, className = '', conOpcion = true }) {
  const [recibo, setRecibo] = useState(false);
  const [modo, setModo] = useState('navegador');
  const [usb, setUsb] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  useEffect(() => { setRecibo(leerReciboPref()); setModo(leerModoPref()); setUsb(usbSoportado()); }, []);

  const cambiarModo = (m) => { setModo(m); guardarModoPref(m); setError(''); setAviso(''); };
  const clic = async () => {
    setError(''); setAviso(''); setImprimiendo(true);
    try {
      await prepararImpresora(modo); // primero: el permiso USB necesita el gesto del clic
      await imprimirVenta(cargar ? await cargar() : venta, { recibo, modo });
    } catch (e) { setError(e.message); }
    finally { setImprimiendo(false); }
  };
  const accionUsb = async (fn, ok) => {
    setError(''); setAviso('');
    try { await fn(); if (ok) setAviso(ok); } catch (e) { setError(e.message); }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={clic} disabled={imprimiendo}
          className={className || 'flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-700 text-xs font-bold uppercase tracking-wider hover:border-white disabled:opacity-50'}>
          <Printer size={14} /> {imprimiendo ? 'Imprimiendo...' : 'Imprimir tickets'}
        </button>
        {conOpcion && (
          <>
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
              <input type="checkbox" checked={recibo} onChange={(e) => { setRecibo(e.target.checked); guardarReciboPref(e.target.checked); }} /> con recibo
            </label>
            {usb && (
              <select aria-label="Modo de impresión" value={modo} onChange={(e) => cambiarModo(e.target.value)}
                className="bg-[#0D0E12] border border-neutral-800 rounded-md px-2 py-1 text-[11px] text-neutral-300">
                <option value="navegador">Diálogo del navegador</option>
                <option value="usb">USB directo (ESC/POS)</option>
              </select>
            )}
          </>
        )}
      </div>
      {conOpcion && usb && modo === 'usb' && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <button type="button" onClick={() => accionUsb(imprimirPruebaUSB, 'Prueba enviada.')} className="text-purple-300 hover:text-white">Imprimir prueba</button>
          <button type="button" onClick={() => accionUsb(() => obtenerImpresora({ elegir: true }), 'Impresora seleccionada.')} className="text-purple-300 hover:text-white">Elegir impresora</button>
          <button type="button" onClick={() => accionUsb(() => obtenerImpresora({ elegir: true, todos: true }), 'Dispositivo seleccionado.')} className="text-neutral-400 hover:text-white">Mostrar todos los dispositivos USB</button>
        </div>
      )}
      {aviso && <p className="text-xs text-emerald-400">{aviso}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
