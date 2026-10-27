'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Check, KeyRound, Mail, Trash2 } from 'lucide-react';
import { api, API_URL } from '@/lib/api';

const campo = 'bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const panel = 'bg-[#121318] border border-neutral-800/80 rounded-xl';
const fecha = (d) => (d ? new Date(d).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' }) : '—');
const FREQ = { weekly: 'Semanal (lunes 7:00, semana anterior)', daily: 'Diario (7:00, día anterior)' };

function Copiar({ texto, etiqueta = 'Copiar' }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }).catch(() => {}); }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 text-[11px] font-bold uppercase tracking-wider hover:border-white">
      {ok ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />} {ok ? 'Copiado' : etiqueta}
    </button>
  );
}

// Datos para el proveedor: llaves de solo lectura (sin datos personales) y reportes automáticos por correo
export default function DatosPage() {
  const [llaves, setLlaves] = useState(null);
  const [nombre, setNombre] = useState('');
  const [vence, setVence] = useState('');
  const [nueva, setNueva] = useState(null); // llave recién creada (se muestra una sola vez)
  const [prog, setProg] = useState(null);
  const [correo, setCorreo] = useState('');
  const [freq, setFreq] = useState('weekly');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(() => {
    api('/llaves').then(setLlaves).catch((e) => setError(e.message));
    api('/reporte-programado').then(setProg).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const crearLlave = async (e) => {
    e.preventDefault(); setError(''); setAviso('');
    try {
      const r = await api('/llaves', { method: 'POST', body: JSON.stringify({ name: nombre, ...(vence ? { expiresAt: new Date(`${vence}T23:59:59-06:00`).toISOString() } : {}) }) });
      setNueva(r); setNombre(''); setVence(''); cargar();
    } catch (err) { setError(err.message); }
  };
  const revocar = async (k) => {
    if (!window.confirm(`¿Revocar la llave "${k.name}"? El proveedor dejará de tener acceso de inmediato.`)) return;
    try { await api(`/llaves/${k.id}`, { method: 'DELETE' }); setAviso(`Llave "${k.name}" revocada.`); cargar(); } catch (err) { setError(err.message); }
  };
  const programar = async (e) => {
    e.preventDefault(); setError(''); setAviso('');
    try { await api('/reporte-programado', { method: 'POST', body: JSON.stringify({ email: correo, frequency: freq }) }); setCorreo(''); setAviso('Reporte programado. El primer envío será en el próximo horario de la frecuencia elegida.'); cargar(); }
    catch (err) { setError(err.message); }
  };
  const accion = async (fn, ok) => { setError(''); setAviso(''); try { const r = await fn(); setAviso(ok ?? r?.message ?? 'Listo.'); cargar(); } catch (err) { setError(err.message); } };

  const ejemplo = `curl -H "x-api-key: TU_LLAVE" "${API_URL}/datos/resumen?desde=2026-10-01&hasta=2026-10-31"`;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Datos y reportes</h1>
        <p className="text-sm text-gray-400 mt-1">Comparte información con tu proveedor de datos sin darle acceso al panel, y recibe resúmenes automáticos por correo.</p>
      </div>
      {error && <p className="text-sm text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}
      {aviso && <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">{aviso}</p>}

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2"><KeyRound size={14} /> Llaves de acceso para el proveedor</h2>
        <p className="text-xs text-neutral-500">Solo lectura y <b>sin datos personales</b> de clientes (nunca nombres ni correos). No sirven para entrar al panel ni modificar nada. Puedes revocarlas en cualquier momento.</p>

        {nueva && (
          <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 space-y-3">
            <p className="text-sm font-bold text-amber-200">Llave creada: {nueva.name}</p>
            <p className="text-xs text-amber-200/80">Cópiala ahora y entrégasela al proveedor por un canal seguro. <b>No se volverá a mostrar</b>; si se pierde, revoca y crea otra.</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 break-all bg-black/40 rounded-lg px-3 py-2 text-xs text-amber-100">{nueva.key}</code>
              <Copiar texto={nueva.key} />
            </div>
            <button onClick={() => setNueva(null)} className="text-xs text-neutral-400 hover:text-white underline">Ya la guardé, ocultar</button>
          </div>
        )}

        <form onSubmit={crearLlave} className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider flex-1 min-w-[200px]">Nombre (proveedor)
            <input required maxLength={80} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Proveedor de datos ACME" className={`${campo} block mt-1 w-full`} /></label>
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Vence (opcional)
            <input type="date" value={vence} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setVence(e.target.value)} className={`${campo} block mt-1`} /></label>
          <button className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider">Crear llave</button>
        </form>

        <div className={`${panel} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Llave</th><th className="px-4 py-3">Último uso</th><th className="px-4 py-3 text-right">Peticiones</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {!llaves ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                : llaves.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aún no hay llaves.</td></tr>
                : llaves.map((k) => (
                  <tr key={k.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums">
                    <td className="px-4 py-3 font-semibold">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{k.keyPrefix}…</td>
                    <td className="px-4 py-3 text-neutral-400">{fecha(k.lastUsedAt)}</td>
                    <td className="px-4 py-3 text-right">{k.requests}</td>
                    <td className="px-4 py-3">{k.revokedAt ? <span className="text-red-300">Revocada</span> : k.expiresAt && new Date(k.expiresAt) < new Date() ? <span className="text-amber-300">Vencida</span> : <span className="text-emerald-300">Activa{k.expiresAt ? ` · vence ${new Date(k.expiresAt).toLocaleDateString('es-GT')}` : ''}</span>}</td>
                    <td className="px-4 py-3 text-right">{k.active && !k.revokedAt && <button onClick={() => revocar(k)} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Revocar"><Trash2 size={15} /></button>}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <details className={`${panel} p-4 text-sm`}>
          <summary className="cursor-pointer font-bold text-neutral-200">Cómo la usa el proveedor</summary>
          <div className="mt-3 space-y-2 text-xs text-neutral-400">
            <p>Se envía en el encabezado <code className="text-purple-300">x-api-key</code>. Filtros opcionales: <code>desde</code>, <code>hasta</code>, <code>cineId</code>, <code>peliculaId</code>, <code>canal</code> (online|box_office), <code>tipo</code> (tickets|food).</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET {API_URL}/datos/resumen</code> — KPIs y series (JSON)</li>
              <li><code>GET {API_URL}/datos/exportar/ventas.csv</code> (también <code>boletos</code>, <code>comida</code>, <code>funciones</code>)</li>
              <li><code>GET {API_URL}/datos/inventario</code> — existencias de dulcería</li>
            </ul>
            <div className="flex items-start gap-2"><code className="flex-1 break-all bg-black/40 rounded-lg px-3 py-2 text-[11px] text-neutral-300">{ejemplo}</code><Copiar texto={ejemplo} /></div>
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2"><Mail size={14} /> Reporte automático por correo</h2>
        <p className="text-xs text-neutral-500">Ingresos netos, boletos, ocupación, dulcería, cupones, combos, reembolsos, inventario por reponer y cierres de caja con diferencia. Sin datos personales de clientes. Hora de Guatemala.</p>
        {prog && !prog.correoConfigurado && <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">El servidor aún no tiene el correo configurado (BREVO_API_KEY y MAIL_FROM): los reportes se programan pero no se enviarán hasta configurarlo.</p>}
        <form onSubmit={programar} className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider flex-1 min-w-[200px]">Correo
            <input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="dueno@empresa.com" className={`${campo} block mt-1 w-full`} /></label>
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Frecuencia
            <select value={freq} onChange={(e) => setFreq(e.target.value)} className={`${campo} block mt-1`}>{Object.entries(FREQ).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <button className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider">Programar</button>
        </form>
        <div className={`${panel} overflow-x-auto`}>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <th className="px-4 py-3">Correo</th><th className="px-4 py-3">Frecuencia</th><th className="px-4 py-3">Último envío</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
            </tr></thead>
            <tbody>
              {!prog ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
                : prog.items.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nadie recibe reportes todavía.</td></tr>
                : prog.items.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-800/60 last:border-0">
                    <td className="px-4 py-3 font-semibold">{s.email}</td>
                    <td className="px-4 py-3 text-neutral-300">{s.frequency === 'daily' ? 'Diario' : 'Semanal'}</td>
                    <td className="px-4 py-3 text-neutral-400">{fecha(s.lastSentAt)}{s.lastError && <span className="block text-[11px] text-red-300">Error: {s.lastError}</span>}</td>
                    <td className="px-4 py-3">{s.active ? <span className="text-emerald-300">Activo</span> : <span className="text-neutral-500">Pausado</span>}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      <button onClick={() => accion(() => api(`/reporte-programado/${s.id}/enviar-ahora`, { method: 'POST' }))} className="px-2.5 py-1 rounded-md border border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white">Enviar ahora</button>
                      <button onClick={() => accion(() => api(`/reporte-programado/${s.id}`, { method: 'PUT', body: JSON.stringify({ active: !s.active }) }), s.active ? 'Reporte pausado.' : 'Reporte reactivado.')} className="px-2.5 py-1 rounded-md border border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-gray-300 hover:text-white">{s.active ? 'Pausar' : 'Activar'}</button>
                      <button onClick={() => { if (window.confirm(`¿Dejar de enviar reportes a ${s.email}?`)) accion(() => api(`/reporte-programado/${s.id}`, { method: 'DELETE' }), 'Eliminado.'); }} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Eliminar"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
