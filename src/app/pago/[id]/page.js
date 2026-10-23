'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, ShieldCheck, CreditCard, AlertCircle, Lock, Loader2, Ticket, Calendar, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { EP } from '@/lib/endpoints';
import { obtenerVenta } from '@/lib/booking';
import { hayCuenta } from '@/lib/guest';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const HOLD_MIN = 10; // debe coincidir con SALE_HOLD_MINUTES del backend
const Q = 'Q';
const dinero = (n) => `${Q}${Number(n).toFixed(2)}`;
const panel = 'bg-[#121318] border border-neutral-800/80 rounded-xl';

const ESTILO_TARJETA = {
  style: {
    base: { color: '#ffffff', fontSize: '15px', fontFamily: 'Inter, sans-serif', '::placeholder': { color: '#737373' } },
    invalid: { color: '#f87171' },
  },
  hidePostalCode: true,
};

function Pasos({ actual = 3, comida = false }) {
  const pasos = comida ? ['PRODUCTOS', 'PAGO', 'CONFIRMACIÓN'] : ['SELECCIONAR ASIENTOS', 'COMIDA', 'PAGO', 'CONFIRMACIÓN'];
  return (
    <div className="flex items-center justify-between max-w-3xl mx-auto w-full py-4 mb-8 px-2">
      {pasos.map((label, i) => {
        const n = i + 1, hecho = n < actual, activo = n === actual;
        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                hecho ? 'bg-emerald-500 text-white' : activo ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white ring-2 ring-purple-400/50' : 'bg-[#121318] border border-neutral-800 text-neutral-500'}`}>
                {hecho ? <Check size={16} /> : n}
              </div>
              <span className={`hidden sm:block text-[10px] font-bold tracking-wider ${activo ? 'text-white' : hecho ? 'text-emerald-400' : 'text-neutral-500'}`}>{label}</span>
            </div>
            {i < pasos.length - 1 && <div className={`h-[2px] flex-1 mx-2 ${hecho ? 'bg-emerald-500' : 'bg-neutral-800'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TarjetaEntrada({ t }) {
  const f = new Date(t.show.showDatetime);
  const peli = t.show.movie;
  return (
    <div className={`${panel} flex items-center gap-4 p-3 sm:p-4`}>
      <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800 bg-neutral-900">
        {peli?.posterUrl && <img src={peli.posterUrl} alt={peli.title} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-sm sm:text-base font-black truncate">{peli?.title}</h4>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><Calendar size={12} className="text-purple-400" />{f.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-purple-400" />{f.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
          {t.show.format && <span className="bg-purple-950/60 border border-purple-800/50 text-purple-300 px-2 py-0.5 rounded font-bold">{t.show.format}</span>}
          <span className="text-neutral-400">{t.show.room?.cinema?.name} · {t.show.room?.name}</span>
          <span className="font-bold bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">Fila {t.seat.rowLabel} — Asiento {t.seat.seatNumber}</span>
        </div>
      </div>
      <span className="text-sm sm:text-base font-extrabold pl-2 border-l border-neutral-800/60 self-stretch flex items-center">{dinero(t.price)}</span>
    </div>
  );
}

function Resumen({ venta }) {
  const boletos = venta.tickets.reduce((s, t) => s + Number(t.price), 0);
  const soloComida = venta.kind === 'food';
  return (
    <div className={`${panel} p-5 space-y-3`}>
      <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold border-b border-neutral-800/80 pb-2">Resumen de compra</h3>
      {!soloComida && <div className="flex justify-between text-xs text-neutral-400"><span>Boletos ({venta.tickets.length})</span><span className="text-neutral-200 font-semibold">{dinero(boletos)}</span></div>}
      {(venta.saleFoodItems ?? []).map((l) => (
        <div key={l.id} className="flex justify-between text-xs text-neutral-400">
          <span className="truncate pr-2">{l.quantity} × {l.foodItem?.name}</span>
          <span className="text-neutral-200 font-semibold">{dinero(l.quantity * l.unitPrice)}</span>
        </div>
      ))}
      <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
        <span className="text-sm uppercase tracking-wider font-black">Total</span>
        <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">{dinero(venta.totalAmount)}</span>
      </div>
    </div>
  );
}

function Estado({ estado, venta, cargo, error, onReintentar, onVer }) {
  const invitado = !hayCuenta();
  if (estado === 'idle') return null;
  const caja = 'bg-[#121318] rounded-2xl p-8 max-w-md w-full text-center space-y-5';
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {estado === 'processing' && (
        <div className={`${caja} border border-neutral-800`}>
          <Loader2 size={48} className="text-purple-500 animate-spin mx-auto" />
          <h3 className="text-xl font-bold">Procesando pago seguro...</h3>
          <p className="text-xs text-neutral-400">No cierres esta ventana.</p>
        </div>
      )}
      {estado === 'success' && (
        <div className={`${caja} border border-emerald-500/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]`}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40"><Check size={36} /></div>
          <div>
            <h3 className="text-2xl font-black">¡Pago confirmado!</h3>
            <p className="text-xs text-neutral-400 mt-1">{venta.kind === 'food' ? 'Tu pedido de dulcería está listo para recoger.' : 'Tus entradas han sido emitidas.'}</p>
          </div>
          <div className="bg-[#0D0E12] p-4 rounded-xl border border-neutral-800 text-left text-xs space-y-2">
            {venta.kind === 'food' ? (
              <>
                <div className="flex justify-between"><span className="text-neutral-400">Recoger en:</span><span className="font-bold text-right">{venta.pickupCinema?.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Productos:</span><span className="font-bold">{(venta.saleFoodItems ?? []).reduce((s, l) => s + l.quantity, 0)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-neutral-400">Película:</span><span className="font-bold">{venta.tickets[0]?.show.movie?.title}</span></div>
                <div className="flex justify-between"><span className="text-neutral-400">Entradas:</span><span className="font-bold">{venta.tickets.length}</span></div>
              </>
            )}
            <div className="flex justify-between"><span className="text-neutral-400">Total pagado:</span><span className="text-emerald-400 font-bold">{dinero(venta.totalAmount)}</span></div>
            {cargo && cargo.chargeCurrency !== 'GTQ' && (
              <div className="flex justify-between"><span className="text-neutral-400">Cargo en tarjeta:</span><span className="font-bold">{cargo.chargeCurrency} {Number(cargo.chargeAmount).toFixed(2)}</span></div>
            )}
            {venta.kind !== 'food' && (venta.saleFoodItems ?? []).length > 0 && <p className="text-[11px] text-purple-300">Tu comida tiene un QR aparte, válido por 6 meses.</p>}
            <p className="text-[11px] text-neutral-500 pt-1">Te enviamos {venta.kind === 'food' ? 'tu código de recogida' : 'las entradas'} a {invitado ? (venta.guestEmail || 'tu correo') : 'tu correo'}.</p>
          </div>
          <button onClick={onVer} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">{venta.kind === 'food' ? 'Ver mi código de recogida' : invitado ? 'Ver mis entradas' : 'Ver mis boletos'}</button>
        </div>
      )}
      {estado === 'failed' && (
        <div className={`${caja} border border-red-500/40`}>
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40"><AlertCircle size={36} /></div>
          <div>
            <h3 className="text-xl font-black">Error en la transacción</h3>
            <p className="text-xs text-neutral-400 mt-1">{error || 'No se pudo procesar el pago.'}</p>
          </div>
          <button onClick={onReintentar} className="w-full py-3 rounded-xl bg-purple-600 text-xs font-bold uppercase tracking-wider">Reintentar</button>
        </div>
      )}
    </div>
  );
}

function FormularioPago({ venta, vencida, onEstado, onError, onCargo }) {
  const stripe = useStripe();
  const elements = useElements();
  const [nombre, setNombre] = useState('');
  const [errNombre, setErrNombre] = useState('');
  const [errTarjeta, setErrTarjeta] = useState('');

  const pagar = async () => {
    if (!stripe || !elements || vencida) return;
    if (!nombre.trim()) return setErrNombre('Requerido');
    setErrNombre('');
    onEstado('processing');
    try {
      // Crea el Payment Intent en el back (monto calculado en el servidor)
      const { clientSecret, chargeAmount, chargeCurrency } = await api(EP.paymentIntent, { method: 'POST', body: JSON.stringify({ saleId: Number(venta.id) }) });
      onCargo?.({ chargeAmount, chargeCurrency });
      const r = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name: nombre } },
      });
      if (r.error) throw new Error(r.error.message);
      // Le pide al back que verifique con Stripe y marque la venta como pagada (no depende solo del webhook)
      await api('/pago/confirmar', { method: 'POST', body: JSON.stringify({ saleId: Number(venta.id) }) }).catch(() => {});
      onEstado('success');
    } catch (e) {
      onError(e.message);
      onEstado('failed');
    }
  };

  const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 placeholder-neutral-500';
  const lbl = 'block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5';
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-purple-950/40 border-purple-500">
        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center"><CreditCard size={20} /></div>
        <div><span className="text-sm font-bold block">Tarjeta de crédito / débito</span><span className="text-xs text-neutral-400">Visa, Mastercard, Amex</span></div>
      </div>

      <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 flex items-center gap-3 text-xs text-purple-300">
        <Lock size={16} className="text-purple-400 flex-shrink-0" />
        <span>Los datos de tu tarjeta los procesa Stripe directamente; nunca pasan por nuestro servidor.</span>
      </div>

      <div>
        <label className={lbl}>Nombre del titular</label>
        <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan Pérez" />
        {errNombre && <span className="text-xs text-red-400 mt-1 block">{errNombre}</span>}
      </div>

      <div>
        <label className={lbl}>Datos de la tarjeta</label>
        <div className="bg-[#0D0E12] border border-neutral-800 rounded-xl px-4 py-3.5">
          <CardElement options={ESTILO_TARJETA} onChange={(e) => setErrTarjeta(e.error?.message ?? '')} />
        </div>
        {errTarjeta && <span className="text-xs text-red-400 mt-1 block">{errTarjeta}</span>}
      </div>

      <div className="pt-4 border-t border-neutral-800">
        <button disabled={!stripe || vencida} onClick={pagar}
          className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${
            !vencida ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-purple-600/25 hover:scale-[1.01]' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'}`}>
          <ShieldCheck size={18} />
          <span>Pagar {dinero(venta.totalAmount)}</span>
        </button>
        <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-neutral-500"><Lock size={12} /><span>Transacción encriptada con SSL de 256 bits</span></div>
      </div>
    </div>
  );
}

export default function PagoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [venta, setVenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('idle'); // idle | processing | success | failed
  const [segundos, setSegundos] = useState(null);
  const [cargo, setCargo] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    obtenerVenta(id)
      .then((v) => {
        if (v.status === 'paid') return router.replace(hayCuenta() && v.kind !== 'food' ? '/mis-boletos' : `/compra/${id}`);
        setVenta(v);
      })
      .catch((e) => {
        if (e.status === 401 || e.status === 403) {
          setError(hayCuenta() ? 'Esta compra no pertenece a tu cuenta.' : 'No encontramos esta compra en este navegador. Si la hiciste como invitado, vuelve a hacerla desde la cartelera.');
          return;
        }
        setError(e.message);
      })
      .finally(() => setCargando(false));
  }, [id, router]);

  // Cuenta regresiva desde la fecha de la venta
  useEffect(() => {
    if (!venta) return;
    const limite = new Date(venta.saleDate).getTime() + HOLD_MIN * 60 * 1000;
    const tick = () => setSegundos(Math.max(0, Math.floor((limite - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [venta]);

  // Tras pagar, el webhook marca la venta como "paid": se consulta hasta confirmarlo
  useEffect(() => {
    if (estado !== 'success') return;
    let intentos = 0;
    const t = setInterval(async () => {
      intentos += 1;
      try {
        const v = await obtenerVenta(id);
        if (v.status === 'paid' || intentos >= 10) { setVenta(v); clearInterval(t); }
      } catch { clearInterval(t); }
    }, 1500);
    return () => clearInterval(t);
  }, [estado, id]);

  const cancelar = async () => {
    if (!window.confirm('¿Cancelar esta compra? Se liberarán tus asientos.')) return;
    setCancelando(true);
    try {
      await api(`/sales/${id}/cancelar`, { method: 'POST' });
      router.push(venta?.kind === 'food' ? '/dulceria' : '/cartelera');
    } catch (e) { setError(e.message); setCancelando(false); }
  };

  const vencida = segundos === 0 || venta?.status === 'expired';
  const tiempo = useMemo(() => (segundos === null ? '' : `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`), [segundos]);

  if (cargando) return <p className="relative z-10 pt-40 text-center text-gray-400">Cargando pedido...</p>;
  if (!venta) return <p className="relative z-10 pt-40 text-center text-red-400">{error || 'Pedido no encontrado'}</p>;

  return (
    <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 pb-16 min-h-screen">
      <Pasos comida={venta.kind === 'food'} actual={venta.kind === 'food' ? (estado === 'success' ? 3 : 2) : (estado === 'success' ? 4 : 3)} />

      <div className="mb-6 p-3 rounded-xl bg-[#121318] border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-purple-400" />
          <span>{venta.kind === 'food' ? (vencida ? 'El pedido venció. Vuelve a armarlo.' : 'Tu pedido está reservado temporalmente.') : vencida ? 'La reserva venció. Vuelve a seleccionar tus asientos.' : 'Tus asientos están reservados temporalmente.'}</span>
        </div>
        {!vencida && <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-1 rounded border border-purple-800/40">Tiempo restante: {tiempo}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider text-neutral-400 font-bold">{venta.kind === 'food' ? `Recoger en ${venta.pickupCinema?.name ?? 'el cine'}` : `Mis entradas (${venta.tickets.length})`}</h2>
              <Ticket size={16} className="text-purple-400" />
            </div>
            {venta.tickets.map((t) => <TarjetaEntrada key={t.id} t={t} />)}
          </div>
          <Resumen venta={venta} />
          {!vencida && (
            <button onClick={cancelar} disabled={cancelando} className="w-full py-2.5 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white hover:border-white disabled:opacity-50">
              {cancelando ? 'Cancelando...' : 'Cancelar compra'}
            </button>
          )}
        </div>

        <div className={`lg:col-span-7 ${panel} p-5 sm:p-7 space-y-6`}>
          <div>
            <h2 className="text-lg font-black">Método de pago</h2>
            <p className="text-xs text-neutral-400 mt-1">Paga tus entradas de forma segura.</p>
          </div>
          {vencida ? (
            <button onClick={() => router.push('/cartelera')} className="w-full py-4 rounded-xl bg-purple-600 text-sm font-black uppercase tracking-wider">Volver a la cartelera</button>
          ) : (
            <Elements stripe={stripePromise}>
              <FormularioPago venta={venta} vencida={vencida} onEstado={setEstado} onError={setError} onCargo={setCargo} />
            </Elements>
          )}
        </div>
      </div>

      <Estado estado={estado} venta={venta} cargo={cargo} error={error} onReintentar={() => setEstado('idle')} onVer={() => router.push(hayCuenta() && venta.kind !== 'food' ? '/mis-boletos' : `/compra/${id}`)} />
    </main>
  );
}