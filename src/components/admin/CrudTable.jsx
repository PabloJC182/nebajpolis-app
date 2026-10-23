'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';

const inputCls = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500';

// Valor para <input type="datetime-local"> en hora local
export const aLocal = (d) => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Campo({ c, valor, onChange, opciones }) {
  const base = { id: c.name, required: c.required, className: inputCls };
  if (c.type === 'textarea') return <textarea {...base} rows={3} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} />;
  if (c.type === 'checkbox')
    return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} /> Activo</label>;
  if (c.type === 'select')
    return (
      <select {...base} value={valor ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccionar...</option>
        {(opciones ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  if (c.type === 'multi')
    return (
      <div className="flex flex-wrap gap-2">
        {(opciones ?? []).map((o) => {
          const on = (valor ?? []).includes(o.value);
          return (
            <button type="button" key={o.value}
              onClick={() => onChange(on ? valor.filter((v) => v !== o.value) : [...(valor ?? []), o.value])}
              className={`px-3 py-1 rounded-full text-xs border ${on ? 'bg-purple-600 border-purple-500' : 'border-neutral-700 text-neutral-400'}`}>{o.label}</button>
          );
        })}
      </div>
    );
  return <input {...base} type={c.type ?? 'text'} step={c.type === 'number' ? 'any' : undefined} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

/**
 * Tabla CRUD genérica.
 * cfg: { titulo, listar(): Promise<[]>, columnas:[{label, render(item)}], campos:[{name,label,type,required,cargar?}],
 *        vacio(): {}, aFormulario(item): {}, aPayload(form): {}, crear?(payload), actualizar?(id,payload), eliminar?(id) }
 */
export default function CrudTable({ cfg, onContexto }) {
  const [items, setItems] = useState([]);
  const [opciones, setOpciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null); // null | 'nuevo' | item
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    cfg.listar().then(setItems).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [cfg]);

  useEffect(() => { onContexto?.({ recargar: cargar, avisar: setAviso, error: setError }); });

  useEffect(() => {
    cargar();
    cfg.campos.filter((c) => c.cargar).forEach((c) =>
      c.cargar().then((o) => setOpciones((p) => ({ ...p, [c.name]: o }))).catch(() => {}));
  }, [cfg, cargar]);

  const abrir = (item) => { setError(''); setEditando(item ?? 'nuevo'); setForm(item ? cfg.aFormulario(item) : cfg.vacio()); };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true); setError('');
    try {
      const payload = cfg.aPayload(form);
      if (editando === 'nuevo') await cfg.crear(payload);
      else await cfg.actualizar(editando.id, payload);
      setEditando(null);
      cargar();
    } catch (err) { setError(err.message); }
    finally { setGuardando(false); }
  };

  const borrar = async (item) => {
    if (!window.confirm('¿Eliminar este registro? No se puede deshacer.')) return;
    try { await cfg.eliminar(item.id); cargar(); } catch (err) { setError(err.message); }
  };

  const soloLectura = !cfg.crear;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{cfg.titulo}</h1>
        {!soloLectura && (
          <button onClick={() => abrir(null)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">
            <Plus size={14} /> Nuevo
          </button>
        )}
      </div>

      {aviso && <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2 mb-4">{aviso}</p>}
      {error && !editando && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              {cfg.columnas.map((c) => <th key={c.label} className="px-4 py-3 font-bold">{c.label}</th>)}
              {(cfg.actualizar || cfg.eliminar || cfg.acciones) && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {cargando ? <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              : items.length === 0 ? <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">Sin registros.</td></tr>
              : items.map((it) => (
                <tr key={it.id} className="border-b border-neutral-800/60 last:border-0 hover:bg-white/[0.02]">
                  {cfg.columnas.map((c) => <td key={c.label} className="px-4 py-3 align-top">{c.render(it)}</td>)}
                  {(cfg.actualizar || cfg.eliminar || cfg.acciones) && (
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {(cfg.acciones ?? []).filter((a) => a.mostrar(it)).map((a) => (
                        <button key={a.label} onClick={() => a.onClick(it, { recargar: cargar, avisar: setAviso, error: setError })}
                          className="px-2.5 py-1 mr-1 rounded-md border border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-white">{a.label}</button>
                      ))}
                      {cfg.actualizar && <button onClick={() => abrir(it)} className="p-1.5 text-gray-400 hover:text-white" aria-label="Editar"><Pencil size={15} /></button>}
                      {cfg.eliminar && <button onClick={() => borrar(it)} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Eliminar"><Trash2 size={15} /></button>}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={guardar} className="bg-[#121318] border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{editando === 'nuevo' ? 'Nuevo' : 'Editar'} — {cfg.titulo}</h2>
              <button type="button" onClick={() => setEditando(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            {cfg.campos.map((c) => (
              <div key={c.name}>
                {c.type !== 'checkbox' && <label htmlFor={c.name} className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">{c.label}</label>}
                <Campo c={c} valor={form[c.name]} opciones={opciones[c.name]} onChange={(v) => setForm((p) => ({ ...p, [c.name]: v }))} />
              </div>
            ))}
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
