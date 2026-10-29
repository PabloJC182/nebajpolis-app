'use client';

import { useCallback, useEffect, useState } from 'react';
import { Minus, Plus, Package } from 'lucide-react';
import BotonImprimir from '@/components/BotonImprimir';
import SeatMap from '@/components/SeatMap';
import EntradaQR from '@/components/EntradaQR';
import PedidoQR from '@/components/PedidoQR';
import { api } from '@/lib/api';
import { EP } from '@/lib/endpoints';
import { adaptarAsiento, lista } from '@/lib/adapters';
import { obtenerComida } from '@/lib/food';
import { obtenerCombos, precioLista } from '@/lib/combos';
import CuponInput from '@/components/CuponInput';

const panel = 'bg-[#121318] border border-neutral-800/80 rounded-xl';
const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500';
const Q = (n) => `Q${Number(n).toFixed(2)}`;
const fechaCorta = (d) => new Date(d).toLocaleString('es-GT', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' });

// Venta en caja: el admin cobra en efectivo/POS y se emiten las entradas al instante
export default function TaquillaPage() {
  const [funciones, setFunciones] = useState([]);
  const [comida, setComida] = useState([]);
  const [showId, setShowId] = useState('');
  const [asientos, setAsientos] = useState([]);
  const [elegidos, setElegidos] = useState([]);
  const [cant, setCant] = useState({});
  const [cliente, setCliente] = useState({ nombre: '', correo: '' });
  const [metodo, setMetodo] = useState('cash');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [combos, setCombos] = useState([]);
  const [comboId, setComboId] = useState('');
  const [cupon, setCupon] = useState(null);

  useEffect(() => {
    api('/shows').then((r) => {
      const ahora = Date.now() - 30 * 60 * 1000; // aún se puede vender una función recién empezada
      setFunciones(lista(r).filter((f) => f.status !== false && new Date(f.showDatetime).getTime() > ahora)
        .sort((a, b) => new Date(a.showDatetime) - new Date(b.showDatetime)));
    }).catch((e) => setError(e.message));
    obtenerComida().then(setComida).catch(() => {});
    obtenerCombos().then(setCombos).catch(() => {});
  }, []);

  const cargarAsientos = useCallback((id) => {
    if (!id) return setAsientos([]);
    api(EP.showSeats(id)).then((r) => setAsientos(lista(r).map(adaptarAsiento))).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { setElegidos([]); cargarAsientos(showId); }, [showId, cargarAsientos]);

  const funcion = funciones.find((f) => String(f.id) === String(showId));
  const toggle = (s) => setElegidos((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]));
  const cambiar = (id, d) => setCant((p) => {
    const n = Math.min(10, Math.max(0, (p[id] ?? 0) + d));
    const { [id]: _, ...resto } = p;
    return n > 0 ? { ...resto, [id]: n } : resto;
  });
  const pedido = comida.filter((c) => cant[c.id] > 0);
  const precioBoleto = Number(funcion?.basePrice ?? 0);
  const combo = combos.find((c) => c.id === comboId && c.ticketQty <= elegidos.length) ?? null;
  const costoCombo = combo ? Math.min(combo.price, precioLista(combo, precioBoleto)) : 0;
  const subBoletos = (elegidos.length - (combo?.ticketQty ?? 0)) * precioBoleto + costoCombo;
  const subComida = pedido.reduce((s, c) => s + c.price * cant[c.id], 0);
  const descCupon = cupon?.descuento ?? 0;
  const total = Math.max(subBoletos + subComida - descCupon, 0);

  const cobrar = async () => {
    if (!funcion || elegidos.length === 0 || enviando) return;
    if (cliente.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())) return setError('El correo no es válido (o déjalo vacío).');
    if (!window.confirm(`Cobrar ${Q(total)} (${metodo === 'cash' ? 'efectivo' : 'POS'}) y emitir ${elegidos.length} entrada(s)?`)) return;
    setEnviando(true); setError('');
    try {
      const r = await api('/sales/taquilla', {
        method: 'POST',
        body: JSON.stringify({
          showId: Number(showId),
          seatIds: elegidos.map(Number),
          paymentMethod: metodo,
          guestName: cliente.nombre.trim(),
          guestEmail: cliente.correo.trim(),
          foodItems: pedido.map((c) => ({ foodItemId: Number(c.id), quantity: cant[c.id] })),
          ...(combo ? { comboId: Number(combo.id) } : {}),
          ...(cupon ? { couponCode: cupon.code } : {}),
        }),
      });
      setResultado(r.sale);
    } catch (e) {
      setError(e.message);
      if (e.status === 409 && !e.datos?.sinStock) { setElegidos([]); cargarAsientos(showId); }
      if (e.status === 409 && e.datos?.sinStock) obtenerComida().then(setComida).catch(() => {});
    } finally { setEnviando(false); }
  };

  const nueva = () => {
    setResultado(null); setElegidos([]); setCant({}); setComboId(''); setCupon(null); setCliente({ nombre: '', correo: '' }); setError('');
    cargarAsientos(showId);
  };

  if (resultado) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Venta #{resultado.id} emitida</h1>
            <p className="text-sm text-gray-400">{Q(resultado.totalAmount)} cobrados{resultado.guestEmail ? ` · copia enviada a ${resultado.guestEmail}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <BotonImprimir venta={resultado} />
            <button onClick={nueva} className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">Nueva venta</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {resultado.tickets.map((t) => <EntradaQR key={t.id} venta={resultado} t={t} />)}
          {resultado.pickupCode && <PedidoQR venta={resultado} />}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Taquilla</h1>
      <p className="text-sm text-gray-400 mb-6">Venta en caja: cobras en efectivo o POS y se emiten las entradas al instante.</p>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div className={`${panel} p-4`}>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Función</label>
            <select className={campo} value={showId} onChange={(e) => setShowId(e.target.value)}>
              <option value="">Selecciona una función...</option>
              {funciones.map((f) => (
                <option key={f.id} value={f.id}>{f.movie?.title} · {fechaCorta(f.showDatetime)} · {f.room?.name} · {Q(f.basePrice)}</option>
              ))}
            </select>
          </div>

          {funcion && (
            <div className={`${panel} p-4 overflow-x-auto`}>
              <SeatMap seats={asientos} selectedSeatIds={elegidos} onToggleSeat={toggle} />
            </div>
          )}

          {funcion && combos.length > 0 && (
            <div className={`${panel} p-4`}>
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-3 flex items-center gap-2"><Package size={14} /> Combo (opcional)</h2>
              <select className={campo} value={comboId} onChange={(e) => setComboId(e.target.value)}>
                <option value="">Sin combo</option>
                {combos.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.ticketQty > elegidos.length}>
                    {c.name} · {c.ticketQty} boleto(s) + {c.items.map((i) => `${i.quantity} ${i.name}`).join(', ')} · {Q(c.price)}{c.ticketQty > elegidos.length ? ' (elige más asientos)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {funcion && comida.length > 0 && (
            <div className={`${panel} p-4`}>
              <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-3">Dulcería (opcional)</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {comida.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2">
                    <div className="min-w-0"><p className="text-sm font-semibold truncate">{c.name} {c.agotado && <span className="text-[10px] text-red-300">AGOTADO</span>}{!c.agotado && c.pocas && <span className="text-[10px] text-amber-300">POCAS</span>}</p><p className="text-xs text-brand-400">{Q(c.price)}</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => cambiar(c.id, -1)} disabled={!cant[c.id]} className="w-7 h-7 rounded-full border border-neutral-700 flex items-center justify-center disabled:opacity-30"><Minus size={13} /></button>
                      <span className="w-5 text-center text-sm font-bold">{cant[c.id] ?? 0}</span>
                      <button aria-label={`Agregar ${c.name}`} disabled={c.agotado || (cant[c.id] ?? 0) >= 10} onClick={() => cambiar(c.id, 1)} className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"><Plus size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className={`${panel} p-5 space-y-4 xl:sticky xl:top-24`}>
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Cobro</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-300">Entradas ({elegidos.length - (combo?.ticketQty ?? 0)})</span><span className="font-semibold">{Q((elegidos.length - (combo?.ticketQty ?? 0)) * precioBoleto)}</span></div>
            {combo && <div className="flex justify-between"><span className="text-gray-300 truncate pr-2">1 × {combo.name}</span><span className="font-semibold">{Q(costoCombo)}</span></div>}
            {pedido.map((c) => <div key={c.id} className="flex justify-between"><span className="text-gray-300 truncate pr-2">{cant[c.id]} × {c.name}</span><span className="font-semibold">{Q(c.price * cant[c.id])}</span></div>)}
          </div>
          {descCupon > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Cupón {cupon.code}</span><span>−{Q(descCupon)}</span></div>}
          {funcion && elegidos.length > 0 && <CuponInput subBoletos={subBoletos} subComida={subComida} guestEmail={cliente.correo.trim().toLowerCase() || null} onChange={setCupon} bloqueado={combo ? 'Los cupones no se combinan con combos.' : null} />}
          <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total</span>
            <span className="text-2xl font-extrabold">{Q(total)}</span>
          </div>

          <div className="flex gap-2">
            {[['cash', 'Efectivo'], ['pos', 'POS']].map(([v, l]) => (
              <button key={v} onClick={() => setMetodo(v)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${metodo === v ? 'bg-purple-600 border-purple-500' : 'border-neutral-700 text-neutral-400'}`}>{l}</button>
            ))}
          </div>

          <div className="space-y-2">
            <input className={campo} placeholder="Nombre del cliente (opcional)" value={cliente.nombre} onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} />
            <input className={campo} type="email" placeholder="Correo para enviar entradas (opcional)" value={cliente.correo} onChange={(e) => setCliente({ ...cliente, correo: e.target.value })} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={!funcion || elegidos.length === 0 || enviando} onClick={cobrar}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-sm font-bold uppercase tracking-wider disabled:opacity-40">
            {enviando ? 'Emitiendo...' : 'Cobrar y emitir entradas'}
          </button>
        </aside>
      </div>
    </div>
  );
}
