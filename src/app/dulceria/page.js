'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus, MapPin } from 'lucide-react';
import { crearPedidoComida } from '@/lib/booking';
import { obtenerComida } from '@/lib/food';
import { obtenerCines, useCine } from '@/lib/cine';
import { hayCuenta } from '@/lib/guest';
import AvisoComida from '@/components/AvisoComida';
import CuponInput from '@/components/CuponInput';

const panel = 'bg-[#121318]/90 border border-neutral-800/80 rounded-xl backdrop-blur-md';
const MAX = 20;

// Dulcería como sección propia: pedido solo de comida, se paga en línea y se recoge en el cine con un QR
export default function DulceriaPage() {
  const router = useRouter();
  const [cineGlobal] = useCine();
  const [cines, setCines] = useState([]);
  const [comida, setComida] = useState([]);
  const [cant, setCant] = useState({});
  const [categoria, setCategoria] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState('');
  const [conCuenta, setConCuenta] = useState(true);
  const [correo, setCorreo] = useState('');
  const [nombreInv, setNombreInv] = useState('');
  const [cineId, setCineId] = useState('');
  const [cupon, setCupon] = useState(null);

  useEffect(() => {
    setConCuenta(hayCuenta());
    try { setCorreo(sessionStorage.getItem('guestEmail') || ''); } catch {}
    Promise.all([obtenerComida(), obtenerCines()])
      .then(([c, ci]) => { setComida(c); setCines(ci); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  // Preselecciona el cine global si existe; si solo hay un cine, ese
  useEffect(() => {
    if (cineId || cines.length === 0) return;
    if (cineGlobal && cines.some((c) => c.id === cineGlobal)) setCineId(cineGlobal);
    else if (cines.length === 1) setCineId(cines[0].id);
  }, [cines, cineGlobal, cineId]);

  const categorias = useMemo(() => ['Todos', ...new Set(comida.map((c) => c.category))], [comida]);
  const visibles = comida.filter((c) => categoria === 'Todos' || c.category === categoria);

  const cambiar = (itemId, delta) =>
    setCant((p) => {
      const nueva = Math.min(MAX, Math.max(0, (p[itemId] ?? 0) + delta));
      const { [itemId]: _, ...resto } = p;
      return nueva > 0 ? { ...resto, [itemId]: nueva } : resto;
    });

  const pedido = comida.filter((c) => cant[c.id] > 0);
  const total = pedido.reduce((s, c) => s + c.price * cant[c.id], 0);
  const cine = cines.find((c) => c.id === cineId);
  const descCupon = cupon?.descuento ?? 0;
  const totalFinal = Math.max(total - descCupon, 0);

  const continuar = async () => {
    if (bloqueo.current) return;
    if (!cineId) return setError('Elige el cine donde recogerás tu pedido.');
    if (pedido.length === 0) return setError('Agrega al menos un producto.');
    if (!conCuenta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return setError('Escribe un correo válido: ahí enviaremos tu código de recogida.');
    bloqueo.current = true; setEnviando(true); setError('');
    try {
      if (!conCuenta) { try { sessionStorage.setItem('guestEmail', correo.trim()); } catch {} }
      const venta = await crearPedidoComida(cineId, pedido.map((c) => ({ foodItemId: c.id, quantity: cant[c.id] })), conCuenta ? null : { email: correo.trim(), nombre: nombreInv.trim() }, { couponCode: cupon?.code });
      router.push(`/pago/${venta.id}`);
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        setConCuenta(false);
        setError('Tu sesión venció. Continúa como invitado con tu correo o vuelve a iniciar sesión.');
      } else setError(e.status === 409 && e.datos?.sinStock ? e.message + ' Baja la cantidad o quita ese producto.' : e.message);
      setEnviando(false); bloqueo.current = false;
    }
  };

  const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500';
  return (
    <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <AvisoComida />
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">DULCERÍA</h1>
      <p className="text-sm text-gray-400 mb-6">Pide y paga en línea, recoge en el cine con tu código QR. Tu código vale 6 meses.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-6">
          <div className={`${panel} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
            <label htmlFor="cine-recogida" className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-300 font-bold"><MapPin size={16} className="text-purple-400" /> Recoger en</label>
            <select id="cine-recogida" value={cineId} onChange={(e) => { setCineId(e.target.value); setError(''); }} className={`${campo} sm:max-w-xs`}>
              <option value="">Elige un cine…</option>
              {cines.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
            </select>
          </div>

          {cargando ? <p className="text-gray-400 py-12 text-center">Cargando menú...</p> : (
            <>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <button key={c} onClick={() => setCategoria(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoria === c ? 'bg-brand-600 border-brand-500 text-white' : 'border-gray-700 text-gray-400 hover:border-brand-500/60 hover:text-white'}`}>{c}</button>
                ))}
              </div>
              {visibles.length === 0 ? <p className="text-gray-500 py-12 text-center">No hay productos disponibles.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibles.map((c) => {
                    const n = cant[c.id] ?? 0;
                    return (
                      <div key={c.id} className={`${panel} p-3 flex gap-3 ${n > 0 ? 'border-purple-500/50' : ''}`}>
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0 flex items-center justify-center text-4xl">
                          {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" /> : '🍿'}
                        </div>
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                          <div><h3 className="font-bold text-sm truncate">{c.name} {c.agotado && <span className="ml-1 text-[10px] font-bold text-red-300 bg-red-950/50 border border-red-800/50 rounded px-1.5 py-0.5 align-middle">AGOTADO</span>}{!c.agotado && c.pocas && <span className="ml-1 text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded px-1.5 py-0.5 align-middle">QUEDAN POCAS</span>}</h3><p className="text-[11px] text-gray-400 line-clamp-2">{c.description}</p></div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-brand-400">Q{c.price}</span>
                            <div className="flex items-center gap-2">
                              <button aria-label={`Quitar ${c.name}`} onClick={() => cambiar(c.id, -1)} disabled={n === 0} className="w-7 h-7 rounded-full border border-neutral-700 flex items-center justify-center hover:border-white disabled:opacity-30"><Minus size={14} /></button>
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
            </>
          )}
        </section>

        <aside className={`lg:col-span-4 ${panel} p-5 space-y-4 lg:sticky lg:top-24`}>
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Tu pedido</h2>
          {cine && <p className="text-xs text-purple-300">Recoges en {cine.name}</p>}
          {pedido.length === 0 && <p className="text-sm text-gray-500">Aún no agregas productos.</p>}
          {pedido.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span className="text-gray-300 truncate pr-2">{cant[c.id]} × {c.name}</span>
              <span className="font-semibold">Q{(c.price * cant[c.id]).toFixed(2)}</span>
            </div>
          ))}
          {descCupon > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Cupón {cupon.code}</span><span>−Q{descCupon.toFixed(2)}</span></div>}
          {pedido.length > 0 && <CuponInput subBoletos={0} subComida={total} guestEmail={!conCuenta ? correo.trim().toLowerCase() : null} onChange={setCupon} />}
          <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Total:</span>
            <span className="text-2xl font-extrabold">Q{totalFinal.toFixed(2)}</span>
          </div>

          {!conCuenta && (
            <div className="space-y-2 pt-4 border-t border-neutral-800">
              <h3 className="text-xs uppercase tracking-wider text-neutral-300 font-bold">Pedir como invitado</h3>
              <p className="text-[11px] text-gray-400">No necesitas cuenta. Enviaremos tu código de recogida a este correo.</p>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Tu correo" autoComplete="email" className={campo} />
              <input value={nombreInv} onChange={(e) => setNombreInv(e.target.value)} placeholder="Tu nombre (opcional)" autoComplete="name" className={campo} />
              <Link href="/login?next=/dulceria" className="block text-[11px] text-purple-300 hover:text-white">¿Ya tienes cuenta? Inicia sesión</Link>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={enviando} onClick={continuar}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-sm font-bold uppercase tracking-wider disabled:opacity-50">
            {enviando ? 'Creando pedido...' : 'Continuar al pago'}
          </button>
        </aside>
      </div>
    </main>
  );
}
