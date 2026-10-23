'use client';

import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';

// Aviso al entrar a la dulcería: la comida tiene un QR propio que vale 6 meses
const KEY = 'avisoComida';

export default function AvisoComida() {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    try { if (!sessionStorage.getItem(KEY)) setAbierto(true); } catch { setAbierto(true); }
  }, []);
  const cerrar = () => { try { sessionStorage.setItem(KEY, '1'); } catch {} setAbierto(false); };
  useEffect(() => {
    if (!abierto) return;
    const esc = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [abierto]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={cerrar}>
      <div role="dialog" aria-modal="true" aria-labelledby="aviso-comida-t" onClick={(e) => e.stopPropagation()}
        className="relative bg-[#121318] border border-purple-500/40 rounded-2xl p-7 max-w-md w-full text-center space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
        <button onClick={cerrar} aria-label="Cerrar" className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto"><Clock size={28} /></div>
        <h2 id="aviso-comida-t" className="text-xl font-black">Tu comida no vence con la función</h2>
        <p className="text-sm text-gray-300">La comida se entrega con un <b>QR propio, aparte de tus boletos</b>, y es válido por <b className="text-purple-300">6 meses</b> desde la compra.</p>
        <p className="text-xs text-gray-400">Si no puedes asistir a la función, no pierdes tu dinero: recoge tu pedido en la dulcería cuando quieras dentro de ese plazo.</p>
        <button onClick={cerrar} autoFocus className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">Entendido</button>
      </div>
    </div>
  );
}
