'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Ticket, QrCode, X, Mail } from 'lucide-react';
import EntradaQR from '@/components/EntradaQR';
import PedidoQR from '@/components/PedidoQR';
import BotonImprimir from '@/components/BotonImprimir';
import { obtenerMisVentas } from '@/lib/booking';
import { api } from '@/lib/api';

const panel = 'bg-[#121318] border border-neutral-800/80 rounded-xl';
const dinero = (n) => `Q${Number(n).toFixed(2)}`;
const ESTADOS = {
  paid: ['Pagada', 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'],
  pending: ['Pendiente', 'text-amber-400 border-amber-500/40 bg-amber-500/10'],
  expired: ['Vencida', 'text-neutral-400 border-neutral-600 bg-neutral-800/50'],
  cancelled: ['Cancelada', 'text-red-400 border-red-500/40 bg-red-500/10'],
  refunded: ['Reembolsada', 'text-sky-400 border-sky-500/40 bg-sky-500/10'],
};

export default function MisBoletosPage() {
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [verQR, setVerQR] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) return router.replace('/login?next=/mis-boletos');
    obtenerMisVentas()
      .then(setVentas)
      .catch((e) => {
        if (e.status === 401 || e.status === 403) return router.replace('/login?next=/mis-boletos');
        setError(e.message);
      })
      .finally(() => setCargando(false));
  }, [router]);

  const cargar = () => obtenerMisVentas().then(setVentas);
  const reenviar = async (v) => {
    setAviso('');
    try { const r = await api(`/sales/${v.id}/reenviar`, { method: 'POST' }); setAviso(r.message); }
    catch (e) { setAviso(e.message); }
  };
  const cancelar = async (v) => {
    if (!window.confirm('¿Cancelar esta compra?')) return;
    try { await api(`/sales/${v.id}/cancelar`, { method: 'POST' }); await cargar(); }
    catch (e) { setAviso(e.message); }
  };

  return (
    <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">MIS BOLETOS</h1>
      <p className="text-sm text-gray-400 mb-8">Historial de tus compras</p>

      {aviso && <p className="mb-4 text-sm text-purple-300 bg-purple-950/40 border border-purple-800/40 rounded-lg px-3 py-2">{aviso}</p>}
      {cargando ? <p className="text-center text-gray-400 py-20">Cargando...</p>
        : error ? <p className="text-center text-red-400 py-20">{error}</p>
        : ventas.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Ticket className="mx-auto text-purple-400" size={40} />
            <p className="text-gray-400">Aún no tienes compras.</p>
            <Link href="/cartelera" className="inline-block px-5 py-2 rounded-full bg-purple-600 text-xs font-bold uppercase tracking-wider">Ver cartelera</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {ventas.map((v) => {
              const comida = v.kind === 'food';
              const t0 = v.tickets?.[0];
              const show = t0?.show;
              const f = show ? new Date(show.showDatetime) : null;
              const [txt, clase] = ESTADOS[v.status] ?? [v.status, 'text-neutral-400 border-neutral-700'];
              return (
                <div key={v.id} className={`${panel} p-4 sm:p-5 flex gap-4`}>
                  <div className="w-20 h-28 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 border border-neutral-800">
                    {comida ? <div className="w-full h-full flex items-center justify-center text-4xl">🍿</div>
                      : show?.movie?.posterUrl && <img src={show.movie.posterUrl} alt={show.movie.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black truncate">{comida ? `Dulcería #${v.id}` : show?.movie?.title ?? `Venta #${v.id}`}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${clase}`}>{txt}</span>
                    </div>
                    {comida && v.pickupCinema && <p className="text-xs text-neutral-400">Recoger en {v.pickupCinema.name}{v.pickedUpAt ? ' · Entregado' : ''}</p>}
                    {f && (
                      <div className="flex flex-wrap gap-x-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1"><Calendar size={12} className="text-purple-400" />{f.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-purple-400" />{f.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' })}</span>
                        <span>{show.room?.cinema?.name} · {show.room?.name}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {v.tickets?.map((t) => (
                        <span key={t.id} className="text-[11px] font-bold bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">{t.seat?.rowLabel}{t.seat?.seatNumber}</span>
                      ))}
                    </div>
                    {v.saleFoodItems?.length > 0 && (
                      <p className="text-[11px] text-neutral-400 truncate">{v.saleFoodItems.map((l) => `${l.quantity}× ${l.foodItem?.name}`).join(', ')}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold">{dinero(v.totalAmount)}</span>
                      {v.status === 'paid' && (
                        <div className="flex items-center gap-4">
                          <button onClick={() => reenviar(v)} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white">
                            <Mail size={14} /> Enviar a mi correo
                          </button>
                          <button onClick={() => setVerQR(v)} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300 hover:text-white">
                            <QrCode size={14} /> {comida ? 'Código de recogida' : 'Ver entradas'}
                          </button>
                        </div>
                      )}
                      {v.status === 'pending' && (
                        <div className="flex items-center gap-4">
                          <button onClick={() => cancelar(v)} className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-red-400">Cancelar</button>
                          <Link href={`/pago/${v.id}`} className="text-xs font-bold uppercase tracking-wider text-purple-300 hover:text-white">Completar pago</Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {verQR && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto p-4" onClick={() => setVerQR(null)}>
          <div className="max-w-md mx-auto my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{verQR.kind === 'food' ? 'Tu pedido' : `Tus entradas (${verQR.tickets.length})`}</h2>
              <button onClick={() => setVerQR(null)} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><X size={20} /></button>
            </div>
            {verQR.kind === 'food' ? <PedidoQR venta={verQR} /> : <>{verQR.tickets.map((t) => <EntradaQR key={t.id} venta={verQR} t={t} />)}{verQR.pickupCode && <PedidoQR venta={verQR} />}</>}
            <div className="flex justify-center"><BotonImprimir venta={verQR} /></div>
            <p className="text-center text-[11px] text-neutral-500">{verQR.kind === 'food' ? 'Presenta el código QR en la dulcería del cine.' : 'Presenta el código QR en la entrada de la sala.'}</p>
          </div>
        </div>
      )}
    </main>
  );
}
