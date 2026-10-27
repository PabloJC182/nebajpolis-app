'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';

const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const Q = (n) => `Q${Number(n).toFixed(2)}`;
const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-GT') : '—');
const aLocal = (d) => { if (!d) return ''; const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const vacio = () => ({ name: '', description: '', imageUrl: '', ticketQty: 2, price: '', validFrom: '', validTo: '', status: true, items: [{ foodItemId: '', quantity: 1 }] });

// Combos: N boletos + productos de dulcería a un precio especial. El servidor reparte el precio entre boletos y comida
// para que los reportes de ingresos por boletos y por comida sigan cuadrando.
export default function CombosPage() {
  const [combos, setCombos] = useState(null);
  const [comida, setComida] = useState([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(null); // null | 'nuevo' | combo
  const [form, setForm] = useState(vacio());
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => { api('/combos/todos').then(setCombos).catch((e) => setError(e.message)); }, []);
  useEffect(() => { cargar(); api('/food/todos').then((r) => setComida(Array.isArray(r) ? r : [])).catch(() => {}); }, [cargar]);

  const abrir = (c) => {
    setError('');
    setEditando(c ?? 'nuevo');
    setForm(c ? { ...c, price: c.price, validFrom: aLocal(c.validFrom), validTo: aLocal(c.validTo), items: c.items.map((i) => ({ foodItemId: String(i.foodItemId), quantity: i.quantity })) } : vacio());
  };
  const setItem = (idx, k, v) => setForm((p) => ({ ...p, items: p.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) }));
  const valorComida = form.items.reduce((s, it) => s + (Number(comida.find((c) => String(c.id) === String(it.foodItemId))?.price) || 0) * (Number(it.quantity) || 0), 0);

  const guardar = async (e) => {
    e.preventDefault(); setGuardando(true); setError('');
    try {
      const payload = {
        name: form.name, description: form.description, imageUrl: form.imageUrl, ticketQty: Number(form.ticketQty), price: Number(form.price), status: !!form.status,
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null, validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
        items: form.items.filter((i) => i.foodItemId).map((i) => ({ foodItemId: Number(i.foodItemId), quantity: Number(i.quantity) })),
      };
      if (editando === 'nuevo') await api('/combos/create/', { method: 'POST', body: JSON.stringify(payload) });
      else await api(`/combos/update/${editando.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      setEditando(null); setAviso('Combo guardado.'); cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  };
  const borrar = async (c) => {
    if (!window.confirm(`¿Eliminar el combo "${c.name}"? Si ya se vendió, solo se desactivará.`)) return;
    try { const r = await api(`/combos/delete/${c.id}`, { method: 'DELETE' }); setAviso(r.message); cargar(); } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Combos</h1>
        <button onClick={() => abrir(null)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider"><Plus size={14} /> Nuevo</button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Boletos + dulcería a un precio especial. Es lo que más sube el ticket promedio. No se combinan con promociones ni cupones.</p>
      {aviso && <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2 mb-4">{aviso}</p>}
      {error && !editando && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <th className="px-4 py-3">Combo</th><th className="px-4 py-3">Incluye</th><th className="px-4 py-3 text-right">Precio</th><th className="px-4 py-3">Vigencia</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>
            {!combos ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              : combos.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">Aún no hay combos.</td></tr>
              : combos.map((c) => (
                <tr key={c.id} className="border-b border-neutral-800/60 last:border-0 align-top">
                  <td className="px-4 py-3"><span className="font-semibold">{c.name}</span>{c.description && <span className="block text-[11px] text-neutral-500">{c.description}</span>}</td>
                  <td className="px-4 py-3 text-neutral-300">{c.ticketQty} boleto(s) + {c.items.map((i) => `${i.quantity} ${i.name}`).join(', ')}<span className="block text-[11px] text-neutral-500">Comida por separado: {Q(c.precioComida)}</span></td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{Q(c.price)}</td>
                  <td className="px-4 py-3 text-neutral-400">{c.validFrom || c.validTo ? `${fecha(c.validFrom)} → ${fecha(c.validTo)}` : 'Siempre'}</td>
                  <td className="px-4 py-3">{c.status ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button onClick={() => abrir(c)} className="p-1.5 text-gray-400 hover:text-white" aria-label="Editar"><Pencil size={15} /></button>
                    <button onClick={() => borrar(c)} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Eliminar"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={guardar} className="bg-[#121318] border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{editando === 'nuevo' ? 'Nuevo combo' : 'Editar combo'}</h2>
              <button type="button" onClick={() => setEditando(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cn">Nombre</label><input id="cn" required className={campo} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cd">Descripción</label><textarea id="cd" rows={2} className={campo} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="ci">URL de la imagen</label><input id="ci" className={campo} value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cq">Boletos incluidos</label><input id="cq" type="number" min="1" max="10" required className={campo} value={form.ticketQty} onChange={(e) => setForm({ ...form, ticketQty: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cp">Precio total (Q)</label><input id="cp" type="number" min="0.01" step="any" required className={campo} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Dulcería incluida</p>
              {form.items.map((it, idx) => (
                <div key={idx} className="flex gap-2">
                  <select aria-label="Producto" className={campo} value={it.foodItemId} onChange={(e) => setItem(idx, 'foodItemId', e.target.value)}>
                    <option value="">Producto...</option>
                    {comida.map((c) => <option key={c.id} value={c.id}>{c.name} · {Q(c.price)}</option>)}
                  </select>
                  <input aria-label="Cantidad" type="number" min="1" max="20" className={`${campo} !w-20`} value={it.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} />
                  <button type="button" aria-label="Quitar producto" disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="text-gray-500 hover:text-red-400 disabled:opacity-30"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { foodItemId: '', quantity: 1 }] })} className="text-xs text-purple-300 hover:text-white">+ Agregar producto</button>
              <p className="text-[11px] text-neutral-500">La comida suelta vale {Q(valorComida)} + {form.ticketQty || 0} boleto(s) al precio de la función. Pon un precio menor al total para que el cliente vea el ahorro.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cv1">Vigente desde</label><input id="cv1" type="datetime-local" className={campo} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5" htmlFor="cv2">Vigente hasta</label><input id="cv2" type="datetime-local" className={campo} value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} /> Activo</label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditando(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider">Cancelar</button>
              <button disabled={guardando} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider disabled:opacity-50">{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
