'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Package } from 'lucide-react';
import { obtenerFuncion, crearVenta } from '@/lib/booking';
import { obtenerComida } from '@/lib/food';
import { promoElegida, limpiarPromo, aplicaEnDia, diasTexto } from '@/lib/promotions';
import { hayCuenta } from '@/lib/guest';
import AvisoComida from '@/components/AvisoComida';
import CuponInput from '@/components/CuponInput';
import { obtenerCombos, precioLista } from '@/lib/combos';
import Link from 'next/link';

const panel = 'bg-[#121318]/90 border border-neutral-800/80 rounded-xl backdrop-blur-md';
const MAX = 20;

export default function ComidaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [funcion, setFuncion] = useState(null);
  const [comida, setComida] = useState([]);
  const [asientos, setAsientos] = useState([]);
  const [cant, setCant] = useState({});
  const [categoria, setCategoria] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const bloqueo = useRef(false); // evita doble envío por doble clic
  const [error, setError] = useState('');
  const [promo, setPromo] = useState(null);
  const [conCuenta, setConCuenta] = useState(true);
  const [correo, setCorreo] = useState('');
  const [nombreInv, setNombreInv] = useState('');
  const [combos, setCombos] = useState([]);
  const [comboId, setComboId] = useState(null);
  const [veces, setVeces] = useState(1);
  const [cupon, setCupon] = useState(null);

  useEffect(() => {
    const sel = new URLSearchParams(window.location.search).get('asientos');
    const lista = sel ? sel.split(',').filter(Boolean) : [];
    if (lista.length === 0) return router.replace(`/funcion/${id}`);
    setAsientos(lista);
    setPromo(promoElegida());
    setConCuenta(hayCuenta());
    try { setCorreo(sessionStorage.getItem('guestEmail') || ''); } catch {}

    Promise.all([obtenerFuncion(id), obtenerComida(), obtenerCombos().catch(() => [])])
      .then(([f, c, cb]) => { setFuncion(f); setComida(c); setCombos(cb); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id, router]);

  const categorias = useMemo(() => ['Todos', ...new Set(comida.map((c) => c.category))], [comida]);
  const visibles = comida.filter((c) => categoria === 'Todos' || c.category === categoria);

  const cambiar = (itemId, delta) =>
    setCant((p) => {
      const nueva = Math.min(MAX, Math.max(0, (p[itemId] ?? 0) + delta));
      const { [itemId]: _, ...resto } = p;
      return nueva > 0 ? { ...resto, [itemId]: nueva } : resto;
    });

  const pedido = comida.filter((c) => cant[c.id] > 0);
  const totalComida = pedido.reduce((s, c) => s + c.price * cant[c.id], 0);
  const precioBoleto = funcion?.pricePerSeat ?? 0;
  // Combos que caben en los asientos elegidos
  const combosPosibles = combos.filter((c) => c.ticketQty <= asientos.length);
  const combo = combosPosibles.find((c) => c.id === comboId) ?? null;
  const maxVeces = combo ? Math.max(1, Math.floor(asientos.length / combo.ticketQty)) : 1;
  const vecesOk = Math.min(veces, maxVeces);
  const boletosCombo = combo ? combo.ticketQty * vecesOk : 0;
  // El servidor cobra el menor entre el precio del combo y el valor por separado
  const costoCombo = combo ? Math.min(combo.price * vecesOk, precioLista(combo, precioBoleto) * vecesOk) : 0;
  const bruto = precioBoleto * (asientos.length - boletosCombo);
  // La promo solo cuenta si la función cae en un día en que aplica (el back lo valida igual); no se combina con combo ni cupón
  const promoAplica = !!promo && !!funcion && aplicaEnDia(promo, funcion.dayKey) && !combo && !cupon;
  const descuento = promoAplica ? bruto * (promo.discount / 100) : 0;
  const totalBoletos = bruto - descuento + costoCombo;
  const descCupon = cupon?.descuento ?? 0;
  const totalFinal = Math.max(totalBoletos + totalComida - descCupon, 0);
  const promoVigenteHoy = !!promo && !!funcion && aplicaEnDia(promo, funcion.dayKey);

  const continuar = async (omitir = false) => {
    if (bloqueo.current) return;
    if (!conCuenta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      return setError('Escribe un correo válido: ahí enviaremos tus entradas.');
    }
    bloqueo.current = true;
    setEnviando(true); setError('');
    try {
      if (!conCuenta) { try { sessionStorage.setItem('guestEmail', correo.trim()); } catch {} }
      const items = omitir ? [] : pedido.map((c) => ({ foodItemId: c.id, quantity: cant[c.id] }));
      const venta = await crearVenta(id, asientos, items, promoAplica ? promo.id : null, conCuenta ? null : { email: correo.trim(), nombre: nombreInv.trim() },
        { comboId: combo?.id, comboQty: vecesOk, couponCode: cupon?.code });
      if (promoAplica) limpiarPromo();
      router.push(`/pago/${venta.id}`);
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        // sesión vencida: el token ya se borró, se continúa como invitado
        setConCuenta(false);
        setError('Tu sesión venció. Continúa como invitado con tu correo o vuelve a iniciar sesión.');
        setEnviando(false); bloqueo.current = false;
        return;
      }
      if (e.status === 409 && e.datos?.sinStock) {
        setError(e.message + ' Quita ese producto o baja la cantidad.');
        setEnviando(false); bloqueo.current = false;
        return;
      }
      if (e.status === 409) {
        setError('Esos asientos ya no están disponibles (otra compra los tiene reservados). Si fuiste tú, ve a "Mis boletos" y completa el pago pendiente, o vuelve a elegir asientos.');
        setEnviando(false);
        bloqueo.current = false;
        return;
      }
      setError(e.message);
      setEnviando(false);
      bloqueo.current = false;
    }
  };

  if (cargando) return <p className="relative z-10 pt-40 text-center text-gray-400">Cargando menú...</p>;
  if (!funcion) return <p className="relative z-10 pt-40 text-center text-red-400">{error || 'Función no encontrada'}</p>;

  const q = funcion.currency;
  return (
    <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <button onClick={() => router.push(`/funcion/${id}`)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white mb-6">
        <ArrowLeft size={16} className="text-brand-400" /> Volver a asientos
      </button>

      <AvisoComida />
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">DULCERÍA</h1>
      <p className="text-sm text-gray-400 mb-2">Agrega comida a tu pedido (opcional)</p>
      <p className="text-xs text-purple-300 mb-6">🍿 La comida lleva un QR aparte, válido por 6 meses aunque no puedas ir a la función.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-6">
          {combosPosibles.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider text-purple-300 font-bold flex items-center gap-2"><Package size={14} /> Combos con boletos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {combosPosibles.map((c) => {
                  const lista = precioLista(c, precioBoleto);
                  const ahorro = Math.max(lista - c.price, 0);
                  const on = comboId === c.id;
                  return (
                    <div key={c.id} className={`${panel} p-4 space-y-2 ${on ? 'border-purple-500/70 shadow-[0_0_18px_rgba(168,85,247,0.25)]' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm">{c.name}</h3>
                        <span className="font-black text-brand-400 whitespace-nowrap">{q}{c.price}</span>
                      </div>
                      <p className="text-[11px] text-gray-400">{c.ticketQty} boleto(s) + {c.items.map((i) => `${i.quantity} ${i.name}`).join(', ')}</p>
                      {c.description && <p className="text-[11px] text-neutral-500">{c.description}</p>}
                      {ahorro > 0 && <p className="text-[11px] text-emerald-400">Ahorras {q}{ahorro.toFixed(2)} frente a comprarlo por separado</p>}
                      <div className="flex items-center justify-between pt-1">
                        <button onClick={() => { setComboId(on ? null : c.id); setVeces(1); }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${on ? 'bg-purple-600 border-purple-500' : 'border-purple-600/60 text-purple-200 hover:bg-purple-950/30'}`}>{on ? 'Quitar combo' : 'Elegir combo'}</button>
                        {on && maxVeces > 1 && (
                          <span className="flex items-center gap-2 text-xs">
                            <button aria-label="Menos combos" onClick={() => setVeces(Math.max(1, vecesOk - 1))} className="w-6 h-6 rounded-full border border-neutral-700 flex items-center justify-center"><Minus size={12} /></button>
                            <b>{vecesOk}</b>
                            <button aria-label="Más combos" onClick={() => setVeces(Math.min(maxVeces, vecesOk + 1))} className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center"><Plus size={12} /></button>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {combo && <p className="text-[11px] text-neutral-400">El combo incluye {boletosCombo} de tus {asientos.length} asientos. Los combos no se combinan con promociones ni cupones.</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <button key={c} onClick={() => setCategoria(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  categoria === c ? 'bg-brand-600 border-brand-500 text-white' : 'border-gray-700 text-gray-400 hover:border-brand-500/60 hover:text-white'}`}>
                {c}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">No hay productos disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibles.map((c) => {
                const n = cant[c.id] ?? 0;
                return (
                  <div key={c.id} className={`${panel} p-3 flex gap-3 ${n > 0 ? 'border-purple-500/50' : ''}`}>
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 flex items-center justify-center text-4xl">
                      {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" /> : '🍿'}
                    </div>
                    <div className="flex flex-col justify-between min-w-0 flex-1">
                      <div>
                        <h3 className="font-bold text-sm truncate">{c.name} {c.agotado && <span className="ml-1 text-[10px] font-bold text-red-300 bg-red-950/50 border border-red-800/50 rounded px-1.5 py-0.5 align-middle">AGOTADO</span>}{!c.agotado && c.pocas && <span className="ml-1 text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded px-1.5 py-0.5 align-middle">QUEDAN POCAS</span>}</h3>
                        <p className="text-[11px] text-gray-400 line-clamp-2">{c.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-brand-400">{q}{c.price}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => cambiar(c.id, -1)} disabled={n === 0} className="w-7 h-7 rounded-full border border-neutral-700 flex items-center justify-center hover:border-white disabled:opacity-30"><Minus size={14} /></button>
                          <span className="w-5 text-center text-sm font-bold">{n}</span>
                          <button aria-label={`Agregar ${c.name}`} disabled={c.agotado} onClick={() => cambiar(c.id, 1)} className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className={`lg:col-span-4 ${panel} p-5 space-y-4 lg:sticky lg:top-24`}>
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Resumen</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Boletos ({asientos.length - boletosCombo})</span>
            <span className="font-semibold">{q}{(bruto - descuento).toFixed(2)}</span>
          </div>
          {combo && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-300 truncate pr-2">{vecesOk} × {combo.name}</span>
              <span className="font-semibold">{q}{costoCombo.toFixed(2)}</span>
            </div>
          )}
          {promo && promoAplica && <p className="text-xs text-emerald-400">Promoción: {promo.name} (−{promo.discount}%)</p>}
          {promo && promoVigenteHoy && !promoAplica && (combo || cupon) && (
            <p className="text-xs text-amber-300">La promoción “{promo.name}” no se aplica junto con {combo ? 'un combo' : 'un cupón'}.</p>
          )}
          {promo && !promoVigenteHoy && (
            <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
              Tu promoción “{promo.name}” solo aplica en funciones de {diasTexto(promo.validDays)}. Esta función se cobrará a precio normal.
            </p>
          )}
          {pedido.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span className="text-gray-300 truncate pr-2">{cant[c.id]} × {c.name}</span>
              <span className="font-semibold">{q}{c.price * cant[c.id]}</span>
            </div>
          ))}
          {descCupon > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Cupón {cupon.code}</span><span>−{q}{descCupon.toFixed(2)}</span></div>}
          <CuponInput subBoletos={bruto - descuento + costoCombo} subComida={totalComida} guestEmail={!conCuenta ? correo.trim().toLowerCase() : null} onChange={setCupon}
            bloqueado={combo ? 'Los cupones no se combinan con combos.' : promoAplica ? `Tienes la promoción “${promo.name}”: los cupones no se combinan con promociones.` : null} />
          {promoAplica && (
            <button onClick={() => { limpiarPromo(); setPromo(null); }} className="text-[11px] text-purple-300 hover:text-white underline">Quitar la promoción para usar un cupón</button>
          )}
          <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total:</span>
            <span className="text-2xl font-extrabold">{q}{totalFinal.toFixed(2)}</span>
          </div>

          {!conCuenta && (
            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <h3 className="text-xs uppercase tracking-wider text-neutral-300 font-bold">Comprar como invitado</h3>
              <p className="text-[11px] text-gray-400">No necesitas cuenta. Enviaremos tus entradas a este correo.</p>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Tu correo" autoComplete="email"
                className="w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              <input value={nombreInv} onChange={(e) => setNombreInv(e.target.value)} placeholder="Tu nombre (opcional)" autoComplete="name"
                className="w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              <Link href={`/login?next=${encodeURIComponent(`/funcion/${id}/comida?asientos=${asientos.join(',')}`)}`} className="block text-[11px] text-purple-300 hover:text-white">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button disabled={enviando} onClick={() => continuar(false)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-sm font-bold uppercase tracking-wider disabled:opacity-50">
            {enviando ? 'Reservando...' : pedido.length || combo ? 'Continuar al pago' : 'Continuar sin comida'}
          </button>
          {pedido.length > 0 && !combo && (
            <button disabled={enviando} onClick={() => continuar(true)} className="w-full text-xs text-gray-400 hover:text-white">
              Omitir comida
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}