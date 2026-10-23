'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Calendar, Clock, Film } from 'lucide-react';
import { hayCuenta } from '@/lib/guest';
import { promoElegida, aplicaEnDia, diasTexto } from '@/lib/promotions';
import { obtenerFuncion, obtenerAsientos } from '@/lib/booking';
import SeatMap from '@/components/SeatMap';

const panel = 'bg-[#121318]/90 border border-neutral-800/80 rounded-xl backdrop-blur-md';

function BookingSteps({ currentStep = 1 }) {
  const steps = ['SELECCIONAR ASIENTOS', 'COMIDA', 'PAGO', 'ENTRADA'];
  return (
    <div className="flex items-center justify-between max-w-md mx-auto w-full py-2">
      {steps.map((label, i) => {
        const n = i + 1, activo = n === currentStep, hecho = n < currentStep;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                activo ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : hecho ? 'bg-purple-900/60 text-purple-300' : 'bg-neutral-800 text-neutral-500'}`}>{n}</div>
              <span className={`text-[11px] sm:text-xs font-bold tracking-wider ${activo ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-[2px] flex-1 mx-3 ${hecho ? 'bg-purple-600' : 'bg-neutral-800'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ShowtimeInfo({ f }) {
  const fila = 'flex items-center justify-between pb-3 border-b border-neutral-800 last:border-0 last:pb-0';
  const et = 'text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2';
  return (
    <div className={`${panel} p-5 space-y-5`}>
      <div className={fila}>
        <span className={et}><Calendar size={14} className="text-purple-400" /> Fecha</span>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-center min-w-[60px]">
          <span className="text-lg font-black block leading-none">{f.date}</span>
          <span className="text-[10px] font-bold text-purple-400">{f.month}</span>
        </div>
      </div>
      <div className={fila}>
        <span className={et}><Clock size={14} className="text-purple-400" /> Hora</span>
        <span className="text-sm font-bold bg-neutral-900/60 px-2.5 py-1 rounded border border-neutral-800">{f.time}</span>
      </div>
      <div className={fila}>
        <span className={et}><Film size={14} className="text-purple-400" /> Formato</span>
        <span className="text-xs font-black text-purple-300 bg-purple-950/50 border border-purple-800/50 px-2.5 py-1 rounded tracking-wider">{f.format}</span>
      </div>
    </div>
  );
}

// Antes de elegir asientos: iniciar sesión, crear cuenta o seguir como invitado (así no se pierde lo elegido)
function EntradaCompra({ id, onInvitado }) {
  const next = encodeURIComponent(`/funcion/${id}`);
  const btn = 'block w-full text-center py-3 rounded-xl text-xs font-bold uppercase tracking-wider';
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121318] border border-neutral-800 rounded-2xl p-7 max-w-sm w-full space-y-4 text-center">
        <h2 className="text-xl font-black">¿Cómo quieres comprar?</h2>
        <p className="text-xs text-neutral-400">Con cuenta guardas tu historial en “Mis boletos”. Como invitado solo necesitas un correo para recibir tus entradas.</p>
        <Link href={`/login?next=${next}`} className={`${btn} bg-gradient-to-r from-purple-600 to-fuchsia-600`}>Iniciar sesión</Link>
        <Link href={`/login?next=${next}&modo=registro`} className={`${btn} border border-purple-600/60 text-purple-200 hover:bg-purple-950/30`}>Crear cuenta</Link>
        <button onClick={onInvitado} className={`${btn} border border-neutral-700 text-neutral-200 hover:border-white`}>Continuar como invitado</button>
        <Link href="/cartelera" className="block text-[11px] text-neutral-500 hover:text-white">Volver a la cartelera</Link>
      </div>
    </div>
  );
}

export default function FuncionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [funcion, setFuncion] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pedirEntrada, setPedirEntrada] = useState(false);
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    setPromo(promoElegida());
    let invitado = false;
    try { invitado = sessionStorage.getItem('modoInvitado') === '1'; } catch {}
    if (!hayCuenta() && !invitado) setPedirEntrada(true);
  }, []);

  useEffect(() => {
    Promise.all([obtenerFuncion(id), obtenerAsientos(id)])
      .then(([f, a]) => { setFuncion(f); setSeats(a); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  const toggle = (s) => setSelectedIds((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]));
  const elegidos = seats.filter((s) => selectedIds.includes(s.id));
  const bruto = elegidos.length * (funcion?.pricePerSeat ?? 0);
  const promoAplica = !!promo && !!funcion && aplicaEnDia(promo, funcion.dayKey);
  const total = promoAplica ? bruto * (1 - promo.discount / 100) : bruto;

  const continuar = () => {
    router.push(`/funcion/${id}/comida?asientos=${selectedIds.join(',')}`);
  };

  if (cargando) return <p className="pt-40 text-center text-gray-400 relative z-10">Cargando función...</p>;
  if (!funcion) return <p className="pt-40 text-center text-red-400 relative z-10">{error || 'Función no encontrada'}</p>;

  const movie = funcion.movie;
  return (
    <div className="relative z-10 flex flex-col">
      {pedirEntrada && <EntradaCompra id={id} onInvitado={() => { try { sessionStorage.setItem('modoInvitado', '1'); } catch {} setPedirEntrada(false); }} />}
      <div className="relative w-full h-[260px] sm:h-[300px] overflow-hidden">
        {movie && <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover opacity-40 blur-[2px]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute bottom-16 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-brand-400 font-semibold text-xs tracking-widest block mb-1">{funcion.room}</span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{movie?.title}</h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-10 sm:-mt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-16 md:pt-24">
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            {movie && (
              <div className="hidden lg:block aspect-[2/3] rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`${panel} p-4`}>
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-3">Asientos seleccionados</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {elegidos.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#0D0E12] border border-neutral-800/80 text-center text-xs text-neutral-500">No has seleccionado ningún asiento</div>
                ) : elegidos.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0D0E12] border border-neutral-800/80 hover:border-purple-500/30">
                    <span className="flex items-center gap-3 text-xs sm:text-sm text-neutral-200">
                      <i className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                      Fila <strong className="text-white">{s.row}</strong> Asiento <strong className="text-white">{s.number}</strong>
                    </span>
                    <span className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-neutral-300">
                      {funcion.currency}{funcion.pricePerSeat}
                      <button onClick={() => toggle(s)} title="Quitar" className="text-neutral-500 hover:text-red-400"><X size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>
              {promo && (
                promoAplica
                  ? <p className="mt-3 text-xs text-emerald-400">Promoción aplicada: {promo.name} (−{promo.discount}%)</p>
                  : <p className="mt-3 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">“{promo.name}” solo aplica en funciones de {diasTexto(promo.validDays)}. Esta función se cobra a precio normal.</p>
              )}
              <div className="pt-4 mt-4 border-t border-neutral-800 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total:</span>
                <span className="text-2xl font-extrabold">{funcion.currency}{Number.isInteger(total) ? total : total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedIds([])} className="flex-1 py-3 rounded-xl border border-purple-600/50 text-purple-300 hover:bg-purple-950/30 text-xs sm:text-sm font-bold uppercase tracking-wider">Cancelar</button>
              <button disabled={!selectedIds.length} onClick={continuar}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg ${
                  selectedIds.length ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-600/25 hover:scale-[1.02]' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'}`}>
                Continuar
              </button>
            </div>
          </div>

          <div className={`lg:col-span-6 ${panel} p-4 sm:p-6 space-y-6 order-1 lg:order-2`}>
            <BookingSteps currentStep={1} />
            <SeatMap seats={seats} selectedSeatIds={selectedIds} onToggleSeat={toggle} />
          </div>

          <div className="lg:col-span-3 order-3"><ShowtimeInfo f={funcion} /></div>
        </div>
      </main>
    </div>
  );
}
