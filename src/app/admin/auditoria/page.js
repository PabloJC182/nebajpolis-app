'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { aQuery } from '@/lib/reportes';

const campo = 'bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const POR_PAGINA = 50;
const ETIQUETAS = {
  crear: 'Creó', actualizar: 'Actualizó', eliminar: 'Eliminó', reembolsar: 'Reembolso', cambiar_rol: 'Cambio de rol',
  ajustar_stock: 'Ajuste de stock', configurar_stock: 'Config. de stock', cerrar_caja: 'Cierre de caja', revocar: 'Revocó',
  exportar_pii: 'Exportó datos personales', enviar_reporte: 'Envió reporte',
};
const SENSIBLE = new Set(['reembolsar', 'cambiar_rol', 'eliminar', 'revocar', 'exportar_pii', 'ajustar_stock']);
const fecha = (d) => new Date(d).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' });

// Bitácora: quién hizo qué y cuándo. Solo lectura (nada se puede editar ni borrar desde aquí).
export default function AuditoriaPage() {
  const [f, setF] = useState({ desde: '', hasta: '', entidad: '', accion: '', q: '' });
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [abierto, setAbierto] = useState(null);

  const cargar = useCallback(() => {
    setError('');
    api(`/auditoria?${aQuery({ ...f, limit: POR_PAGINA, offset: pagina * POR_PAGINA })}`).then(setDatos).catch((e) => setError(e.message));
  }, [f, pagina]);
  useEffect(() => { const id = setTimeout(cargar, 250); return () => clearTimeout(id); }, [cargar]);

  const cambiar = (k, v) => { setPagina(0); setF((p) => ({ ...p, [k]: v })); };
  const total = datos?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Auditoría</h1>
        <p className="text-sm text-gray-400 mt-1">Quién hizo qué y cuándo: cambios de precios, reembolsos, roles, inventario, llaves y cierres de caja. Es solo lectura.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Desde<input type="date" value={f.desde} onChange={(e) => cambiar('desde', e.target.value)} className={`${campo} block mt-1`} /></label>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Hasta<input type="date" value={f.hasta} onChange={(e) => cambiar('hasta', e.target.value)} className={`${campo} block mt-1`} /></label>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Sección
          <select value={f.entidad} onChange={(e) => cambiar('entidad', e.target.value)} className={`${campo} block mt-1`}>
            <option value="">Todas</option>{(datos?.entidades ?? []).map((x) => <option key={x}>{x}</option>)}
          </select></label>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Acción
          <select value={f.accion} onChange={(e) => cambiar('accion', e.target.value)} className={`${campo} block mt-1`}>
            <option value="">Todas</option>{(datos?.acciones ?? []).map((x) => <option key={x} value={x}>{ETIQUETAS[x] ?? x}</option>)}
          </select></label>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider flex-1 min-w-[180px]">Buscar
          <input value={f.q} onChange={(e) => cambiar('q', e.target.value)} placeholder="Usuario o texto..." className={`${campo} block mt-1 w-full`} /></label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Quién</th><th className="px-4 py-3">Acción</th><th className="px-4 py-3">Detalle</th>
          </tr></thead>
          <tbody>
            {!datos ? <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Cargando...</td></tr>
              : datos.items.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">Sin registros con estos filtros.</td></tr>
              : datos.items.map((a) => (
                <tr key={a.id} className="border-b border-neutral-800/60 last:border-0 align-top hover:bg-white/[0.02] cursor-pointer" onClick={() => setAbierto(abierto === a.id ? null : a.id)}>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-400 tabular-nums">{fecha(a.createdAt)}</td>
                  <td className="px-4 py-3"><span className="font-semibold">{a.actor}</span>{a.role && <span className="block text-[11px] text-neutral-500">{a.role}</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded ${SENSIBLE.has(a.action) ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' : 'bg-purple-950/40 text-purple-300 border border-purple-800/40'}`}>{ETIQUETAS[a.action] ?? a.action}</span>
                    <span className="block text-[11px] text-neutral-500 mt-1">{a.entity}{a.entityId ? ` #${a.entityId}` : ''}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-200">
                    {a.summary}
                    {abierto === a.id && (
                      <div className="mt-2 text-xs text-neutral-400 space-y-1 border-t border-neutral-800 pt-2">
                        {a.meta?.cambios && Object.entries(a.meta.cambios).map(([k, c]) => <p key={k}><b className="text-neutral-300">{k}:</b> {String(c.antes ?? '—')} → {String(c.despues ?? '—')}</p>)}
                        {a.ip && <p>IP: {a.ip}</p>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>{total} registro(s)</span>
        <span className="flex items-center gap-2">
          <button disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} className="px-3 py-1.5 rounded-lg border border-neutral-700 disabled:opacity-30">Anterior</button>
          Página {pagina + 1} de {paginas}
          <button disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)} className="px-3 py-1.5 rounded-lg border border-neutral-700 disabled:opacity-30">Siguiente</button>
        </span>
      </div>
    </div>
  );
}
