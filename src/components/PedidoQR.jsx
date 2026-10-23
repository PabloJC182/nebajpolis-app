'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MapPin } from 'lucide-react';

// Código de recogida de un pedido de dulcería (lo firma el back y llega en venta.pickupCode)
export default function PedidoQR({ venta }) {
  const [img, setImg] = useState('');
  const entregado = !!venta.pickedUpAt;
  useEffect(() => {
    if (!venta.pickupCode) return;
    QRCode.toDataURL(venta.pickupCode, { width: 240, margin: 1, color: { dark: '#000000', light: '#ffffff' } }).then(setImg).catch(() => setImg(''));
  }, [venta.pickupCode]);
  const cine = venta.pickupCinema;
  return (
    <div className="bg-[#121318] border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="p-4 space-y-2 border-b border-dashed border-neutral-700">
        <p className="font-black">{venta.kind === 'food' ? `Pedido de dulcería #${venta.id}` : 'Tu comida (QR aparte)'}</p>
        {!cine && <p className="text-xs text-neutral-400 flex items-start gap-1.5"><MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" /><span>Recógelo en la dulcería del cine de tu función (o de cualquier sucursal).</span></p>}
        {cine && (
          <p className="text-xs text-neutral-400 flex items-start gap-1.5"><MapPin size={13} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <span><b className="text-neutral-200">{cine.name}</b>{cine.address ? ` · ${cine.address}` : ''}</span></p>
        )}
        <ul className="text-sm text-neutral-300 space-y-0.5 pt-1">
          {(venta.saleFoodItems ?? []).map((l) => <li key={l.id}>{l.quantity} × {l.foodItem?.name}</li>)}
        </ul>
      </div>
      <div className="p-4 flex flex-col items-center gap-2 bg-[#0D0E12]">
        <div className="relative">
          {img ? <img src={img} alt="Código QR de recogida" className={`w-40 h-40 rounded-lg bg-white p-1 ${entregado ? 'opacity-25' : ''}`} /> : <div className="w-40 h-40 rounded-lg bg-neutral-900" />}
          {entregado && <span className="absolute inset-0 flex items-center justify-center text-sm font-black tracking-widest text-red-400 -rotate-12">ENTREGADO</span>}
        </div>
        {venta.foodValidUntil && <p className="text-[11px] text-purple-300">Válido hasta el {new Date(venta.foodValidUntil).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        <span className="text-[10px] font-mono text-neutral-500">{venta.pickupCode}</span>
      </div>
    </div>
  );
}
