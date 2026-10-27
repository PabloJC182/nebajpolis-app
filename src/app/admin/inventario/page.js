'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Tarjeta } from '@/components/admin/Graficas';

const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const MOTIVOS = { venta: 'Venta', devolucion: 'Devolución', reposicion: 'Reposición', merma: 'Merma', conteo: 'Conteo' };
const fecha = (d) => new Date(d).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' });

function Estado({ i }) {
  if (!i.controlado) return <span className="text-xs text-neutral-500">Sin control</span>;
  if (i.agotado) return <span className="text-xs font-bold text-red-300 bg-red-950/50 border border-red-800/50 rounded px-2 py-0.5">AGOTADO</span>;
  if (i.bajo) return <span className="text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 rounded px-2 py-0.5">POR REPONER</span>;
  return <span className="text-xs font-bold text-emerald-300">OK</span>;
}

// Inventario de dulcería: existencias, reposición, merma y conteo físico (todo queda en el kardex y en la auditoría)
export default function InventarioPage() {
  const [items, setItems] = useState(null);
  const [mov, setMov] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [modal, setModal] = useState(null); // { item, tipo }
  const [form, setForm] = useState({ cantidad: '', nota: '' });
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('');

  const cargar = useCallback(() => {
    api('/inventario').then(setItems).catch((e) => setError(e.message));
    api('/inventario/movimientos?limit=30').then(setMov).catch(() => {});
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (item, tipo) => { setModal({ item, tipo }); setForm({ cantidad: tipo === 'conteo' && item.controlado ? String(item.stock) : '', nota: '' }); setError(''); };
  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      await api(`/inventario/${modal.item.id}/ajuste`, { method: 'POST', body: JSON.stringify({ tipo: modal.tipo, cantidad: Number(form.cantidad), nota: form.nota }) });
      setAviso(`${modal.item.name}: ${modal.tipo === 'reposicion' ? 'reposición' : modal.tipo === 'merma' ? 'merma' : 'conteo'} registrado.`);
      setModal(null); cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  };
  const cambiarMinimo = async (i) => {
    const v = window.prompt(`Cantidad mínima de "${i.name}" antes de avisar que hay que reponer:`, String(i.stockMin));
    if (v === null) return;
    try { await api(`/inventario/${i.id}/config`, { method: 'PUT', body: JSON.stringify({ stockMin: Number(v) }) }); cargar(); } catch (err) { setError(err.message); }
  };
  const quitarControl = async (i) => {
    if (!window.confirm(`¿Dejar de controlar el inventario de "${i.name}"? Se podrá vender sin límite.`)) return;
    try { await api(`/inventario/${i.id}/config`, { method: 'PUT', body: JSON.stringify({ controlar: false }) }); cargar(); } catch (err) { setError(err.message); }
  };

  const ver = (items ?? []).filter((i) => i.name.toLowerCase().includes(filtro.toLowerCase()));
  const alertas = (items ?? []).filter((i) => i.agotado || i.bajo);
  const tipoTxt = { reposicion: 'Reponer (sumar)', merma: 'Registrar merma (restar)', conteo: 'Conteo físico (fijar cantidad)' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Inventario de dulcería</h1>
        <p className="text-sm text-gray-400 mt-1">Las existencias se apartan al reservar y vuelven si la compra vence, se cancela o se reembolsa. Un producto “sin control” se vende sin límite: empieza con un conteo.</p>
      </div>

      {aviso && <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">{aviso}</p>}
      {error && !modal && <p className="text-sm text-red-400">{error}</p>}

      {items && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Tarjeta label="Productos" valor={items.length} sub={`${items.filter((i) => i.controlado).length} con control`} />
          <Tarjeta label="Agotados" valor={items.filter((i) => i.agotado).length} alerta={items.some((i) => i.agotado)} />
          <Tarjeta label="Por reponer" valor={items.filter((i) => i.bajo).length} alerta={items.some((i) => i.bajo)} sub={alertas.length ? alertas.slice(0, 3).map((i) => i.name).join(', ') : undefined} />
          <Tarjeta label="Sin control" valor={items.filter((i) => !i.controlado).length} />
        </div>
      )}

      <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar producto..." className={`${campo} max-w-xs`} />
      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <th className="px-4 py-3">Producto</th><th className="px-4 py-3 text-right">Existencias</th><th className="px-4 py-3 text-right">Mínimo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {!items ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              : ver.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Sin productos.</td></tr>
              : ver.map((i) => (
                <tr key={i.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums">
                  <td className="px-4 py-3"><span className="font-semibold">{i.name}</span><span className="block text-[11px] text-neutral-500">{i.category}{!i.status && ' · oculto'}</span></td>
                  <td className="px-4 py-3 text-right text-lg font-black">{i.controlado ? i.stock : '—'}</td>
                  <td className="px-4 py-3 text-right text-neutral-400">{i.controlado ? <button onClick={() => cambiarMinimo(i)} className="underline decoration-dotted hover:text-white">{i.stockMin}</button> : '—'}</td>
                  <td className="px-4 py-3"><Estado i={i} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                    {i.controlado && <button onClick={() => abrir(i, 'reposicion')} className="px-2.5 py-1 rounded-md border border-emerald-700/60 text-emerald-300 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-950/30">Reponer</button>}
                    {i.controlado && <button onClick={() => abrir(i, 'merma')} className="px-2.5 py-1 rounded-md border border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white">Merma</button>}
                    <button onClick={() => abrir(i, 'conteo')} className="px-2.5 py-1 rounded-md border border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white">{i.controlado ? 'Conteo' : 'Empezar control'}</button>
                    {i.controlado && <button onClick={() => quitarControl(i)} className="px-2 py-1 text-[11px] text-neutral-500 hover:text-red-400" title="Dejar de controlar">✕</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Últimos movimientos (kardex)</h2>
        <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <th className="px-4 py-2.5">Fecha</th><th className="px-4 py-2.5">Producto</th><th className="px-4 py-2.5">Motivo</th><th className="px-4 py-2.5 text-right">Cambio</th><th className="px-4 py-2.5 text-right">Queda</th><th className="px-4 py-2.5">Nota</th>
            </tr></thead>
            <tbody>
              {mov.length === 0 ? <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aún no hay movimientos.</td></tr> : mov.map((m) => (
                <tr key={m.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums">
                  <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap">{fecha(m.createdAt)}</td>
                  <td className="px-4 py-2.5">{m.foodItem?.name}</td>
                  <td className="px-4 py-2.5">{MOTIVOS[m.reason] ?? m.reason}{m.saleId ? <span className="text-neutral-500"> · venta #{m.saleId}</span> : ''}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${m.delta < 0 ? 'text-red-300' : 'text-emerald-300'}`}>{m.delta > 0 ? '+' : ''}{m.delta}</td>
                  <td className="px-4 py-2.5 text-right">{m.stockAfter}</td>
                  <td className="px-4 py-2.5 text-neutral-400">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={guardar} className="bg-[#121318] border border-neutral-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-black">{modal.item.name}</h2>
            <p className="text-xs text-neutral-400">{tipoTxt[modal.tipo]}{modal.item.controlado ? ` · hoy hay ${modal.item.stock}` : ''}</p>
            <div>
              <label htmlFor="cant" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input id="cant" type="number" min="0" step="1" required autoFocus value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className={campo} />
            </div>
            <div>
              <label htmlFor="nota" className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">{modal.tipo === 'merma' ? 'Motivo (obligatorio)' : 'Nota (opcional)'}</label>
              <input id="nota" required={modal.tipo === 'merma'} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder={modal.tipo === 'merma' ? 'Vencido, derramado, dañado...' : 'Factura, proveedor...'} className={campo} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider">Cancelar</button>
              <button disabled={guardando} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
