'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Ticket } from 'lucide-react';
import EntradaQR from '@/components/EntradaQR';
import PedidoQR from '@/components/PedidoQR';
import BotonImprimir from '@/components/BotonImprimir';
import { obtenerVenta } from '@/lib/booking';
import { api } from '@/lib/api';
import { hayCuenta } from '@/lib/guest';

const dinero = (n) => `Q${Number(n).toFixed(2)}`;

// Entradas de una compra (sirve para invitados: se autoriza con el token guardado en este navegador)
export default function CompraPage() {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerVenta(id)
      .then(setVenta)
      .catch((e) => setError(e.status === 403 || e.status === 401
        ? 'No encontramos esta compra en este navegador. Tus entradas también están en el correo que te enviamos.'
        : e.message))
      .finally(() => setCargando(false));
  }, [id]);

  const reenviar = async () => {
    setAviso('');
    try { const r = await api(`/sales/${id}/reenviar`, { method: 'POST' }); setAviso(r.message); }
    catch (e) { setAviso(e.message); }
  };

  if (cargando) return <p className="relative z-10 pt-40 text-center text-gray-400">Cargando...</p>;
  if (!venta) return <p className="relative z-10 pt-40 px-4 text-center text-red-400">{error || 'Compra no encontrada'}</p>;

  const pagada = venta.status === 'paid';
  const correo = venta.appUser?.email || venta.guestEmail;
  return (
    <main className="relative z-10 max-w-md mx-auto px-4 pt-28 pb-16 min-h-screen space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight">{venta.kind === 'food' ? 'TU PEDIDO' : 'TUS ENTRADAS'}</h1>
        <p className="text-sm text-gray-400">Compra #{venta.id} · {dinero(venta.totalAmount)}</p>
      </div>

      {!pagada ? (
        <div className="bg-[#121318] border border-neutral-800 rounded-xl p-5 space-y-3 text-sm text-gray-300">
          <p>Esta compra está en estado <b>{venta.status === 'pending' ? 'pendiente de pago' : venta.status}</b>.</p>
          {venta.status === 'pending' && <Link href={`/pago/${venta.id}`} className="inline-block px-4 py-2 rounded-full bg-purple-600 text-xs font-bold uppercase tracking-wider">Completar pago</Link>}
        </div>
      ) : (
        <>
          {correo && <p className="text-xs text-neutral-400">Enviamos una copia a <b className="text-neutral-200">{correo}</b>.</p>}
          {venta.kind === 'food'
            ? <PedidoQR venta={venta} />
            : <>{venta.tickets.map((t) => <EntradaQR key={t.id} venta={venta} t={t} />)}{venta.pickupCode && <PedidoQR venta={venta} />}</>}
          <p className="text-center text-[11px] text-neutral-500">{venta.kind === 'food' ? 'Presenta el código QR en la dulcería del cine.' : 'Presenta el código QR en la entrada de la sala.'}</p>
          <BotonImprimir venta={venta} />
          <button onClick={reenviar} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:border-white">
            <Mail size={14} /> Reenviar a mi correo
          </button>
          {aviso && <p className="text-sm text-purple-300 bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2">{aviso}</p>}
        </>
      )}

      <div className="flex justify-center gap-5 text-xs font-bold uppercase tracking-wider">
        <Link href={venta.kind === 'food' ? '/dulceria' : '/cartelera'} className="text-purple-300 hover:text-white">{venta.kind === 'food' ? 'Pedir más' : 'Ver cartelera'}</Link>
        {hayCuenta() && <Link href="/mis-boletos" className="text-purple-300 hover:text-white flex items-center gap-1"><Ticket size={13} />Mis boletos</Link>}
      </div>
    </main>
  );
}
