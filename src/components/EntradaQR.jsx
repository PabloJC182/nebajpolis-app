'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Código que lleva el QR de cada entrada (venta + boleto + asiento)
// El codigo (firmado) lo genera el back y llega en cada boleto de una venta pagada
const codigo = (v, t) => t.code ?? `NEBAJPOLIS|V${v.id}|T${t.id}`;

export default function EntradaQR({ venta, t }) {
  const [img, setImg] = useState('');
  useEffect(() => {
    QRCode.toDataURL(codigo(venta, t), { width: 240, margin: 1, color: { dark: '#000000', light: '#ffffff' } }).then(setImg).catch(() => setImg(''));
  }, [venta, t]);
  const f = new Date(t.show.showDatetime);
  return (
    <div className="bg-[#121318] border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="p-4 space-y-1 border-b border-dashed border-neutral-700">
        <p className="font-black truncate">{t.show.movie?.title}</p>
        <p className="text-xs text-neutral-400">{f.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })} · {f.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' })}</p>
        <p className="text-xs text-neutral-400">{t.show.room?.cinema?.name} · {t.show.room?.name}</p>
        <p className="text-sm font-bold text-purple-300">Fila {t.seat.rowLabel} — Asiento {t.seat.seatNumber}</p>
      </div>
      <div className="p-4 flex flex-col items-center gap-2 bg-[#0D0E12]">
        <div className="relative">
          {img ? <img src={img} alt="Código QR de la entrada" className={`w-40 h-40 rounded-lg bg-white p-1 ${t.usedAt ? 'opacity-25' : ''}`} /> : <div className="w-40 h-40 rounded-lg bg-neutral-900" />}
          {t.usedAt && <span className="absolute inset-0 flex items-center justify-center text-sm font-black tracking-widest text-red-400 -rotate-12">USADA</span>}
        </div>
        <span className="text-[10px] font-mono text-neutral-500">{codigo(venta, t)}</span>
      </div>
    </div>
  );
}

