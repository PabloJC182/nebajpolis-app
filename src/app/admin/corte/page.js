'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { obtenerVenta } from '@/lib/booking';
import { obtenerCorte, hoyGT } from '@/lib/reportes';
import { leerUsuario } from '@/lib/roles';
import BotonImprimir from '@/components/BotonImprimir';
import { Tarjeta, Q } from '@/components/admin/Graficas';
import { Lock } from 'lucide-react';

const campo = 'bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const METODO = { cash: 'Efectivo', pos: 'POS' };
const hora = (d) => new Date(d).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' });
const dif = (n) => (Math.abs(n) < 0.005 ? <span className="text-emerald-300">Cuadra</span> : <span className={n < 0 ? 'text-red-300 font-bold' : 'text-amber-300 font-bold'}>{n > 0 ? '+' : '−'}{Q(Math.abs(n))}</span>);

// Cierre de caja "ciego": el cajero cuenta lo que tiene SIN ver cuánto debería haber; el sistema compara y guarda la diferencia.
function CierreCaja({ onCerrado }) {
  const [turno, setTurno] = useState(null);
  const [efectivo, setEfectivo] = useState('');
  const [pos, setPos] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [pideNota, setPideNota] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const cargar = useCallback(() => api('/cierres/turno').then(setTurno).catch((e) => setError(e.message)), []);
  useEffect(() => { cargar(); }, [cargar]);

  const cerrar = async (e) => {
    e.preventDefault(); setError(''); setEnviando(true);
    try {
      const r = await api('/cierres', { method: 'POST', body: JSON.stringify({ countedCash: Number(efectivo || 0), countedPos: Number(pos || 0), note: nota }) });
      setResultado(r); setEfectivo(''); setPos(''); setNota(''); setPideNota(false); cargar(); onCerrado?.();
    } catch (err) {
      setError(err.message);
      if (err.datos?.hayDiferencia) setPideNota(true);
    } finally { setEnviando(false); }
  };

  return (
    <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5 space-y-4" aria-label="Cerrar caja">
      <div className="flex items-center gap-2"><Lock size={15} className="text-purple-400" /><h2 className="text-xs uppercase tracking-wider text-neutral-300 font-bold">Cerrar caja</h2></div>
      {turno && <p className="text-xs text-neutral-400">Turno abierto desde {hora(turno.desde)} · {turno.ventas} venta(s){turno.reembolsos ? ` · ${turno.reembolsos} reembolso(s)` : ''}. Cuenta el dinero y escribe lo que tienes: el sistema compara con lo que debería haber.</p>}
      {resultado && (
        <div className={`rounded-lg border px-4 py-3 text-sm space-y-1 ${Math.abs(resultado.diffCash) + Math.abs(resultado.diffPos) < 0.005 ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-amber-800/50 bg-amber-950/20'}`}>
          <p className="font-bold">Caja cerrada · {resultado.salesCount} venta(s)</p>
          <p>Efectivo: contaste {Q(resultado.countedCash)}, esperado {Q(resultado.expectedCash)} → {dif(Number(resultado.diffCash))}</p>
          <p>POS: contaste {Q(resultado.countedPos)}, esperado {Q(resultado.expectedPos)} → {dif(Number(resultado.diffPos))}</p>
        </div>
      )}
      <form onSubmit={cerrar} className="grid sm:grid-cols-2 gap-3">
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Efectivo contado (Q)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={efectivo} onChange={(e) => setEfectivo(e.target.value)} placeholder="0.00" className={`${campo} block w-full mt-1`} /></label>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Total de vouchers del POS (Q)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={pos} onChange={(e) => setPos(e.target.value)} placeholder="0.00" className={`${campo} block w-full mt-1`} /></label>
        {pideNota && (
          <label className="sm:col-span-2 text-xs text-amber-300 font-bold uppercase tracking-wider">Motivo de la diferencia
            <input required maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. faltó cambio de Q5, se devolvió un boleto..." className={`${campo} block w-full mt-1 normal-case tracking-normal font-normal`} /></label>
        )}
        {error && <p className="sm:col-span-2 text-sm text-amber-300">{error}</p>}
        <div className="sm:col-span-2"><button disabled={enviando} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider disabled:opacity-50">{enviando ? 'Cerrando...' : 'Cerrar caja'}</button></div>
      </form>
    </section>
  );
}

function Cierres({ recarga, mostrarCajero }) {
  const [datos, setDatos] = useState(null);
  useEffect(() => { api('/cierres').then(setDatos).catch(() => setDatos({ items: [] })); }, [recarga]);
  if (!datos) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Cierres de caja (últimos 30 días)</h2>
      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <th className="px-4 py-3">Cierre</th>{mostrarCajero && <th className="px-4 py-3">Cajero</th>}<th className="px-4 py-3 text-right">Ventas</th>
            <th className="px-4 py-3 text-right">Efectivo (contado / esperado)</th><th className="px-4 py-3 text-right">POS (contado / esperado)</th><th className="px-4 py-3">Diferencia</th><th className="px-4 py-3">Nota</th>
          </tr></thead>
          <tbody>
            {datos.items.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aún no hay cierres.</td></tr> : datos.items.map((c) => (
              <tr key={c.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums align-top">
                <td className="px-4 py-3 whitespace-nowrap">{hora(c.closedAt)}</td>
                {mostrarCajero && <td className="px-4 py-3 font-semibold">{c.cajero}</td>}
                <td className="px-4 py-3 text-right">{c.salesCount}</td>
                <td className="px-4 py-3 text-right">{Q(c.countedCash)} / {Q(c.expectedCash)}</td>
                <td className="px-4 py-3 text-right">{Q(c.countedPos)} / {Q(c.expectedPos)}</td>
                <td className="px-4 py-3 whitespace-nowrap">E: {dif(c.diffCash)} · P: {dif(c.diffPos)}</td>
                <td className="px-4 py-3 text-neutral-400 max-w-[240px]">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Corte de caja: lo cobrado en taquilla por cajero, separado en efectivo y POS.
// La taquilla solo ve el suyo (y puede reimprimir sus ventas); admin y analista ven el de todos.
export default function CortePage() {
  const [fecha, setFecha] = useState(hoyGT());
  const [corte, setCorte] = useState(null);
  const [mias, setMias] = useState(null);
  const [error, setError] = useState('');
  const [rol, setRol] = useState(null);
  const [recarga, setRecarga] = useState(0);
  useEffect(() => setRol(leerUsuario()?.role ?? null), []);

  const cargar = useCallback(() => {
    setError('');
    obtenerCorte(fecha).then(setCorte).catch((e) => setError(e.message));
    if (rol === 'taquilla' || rol === 'admin') api(`/sales/taquilla/mias?fecha=${fecha}`).then(setMias).catch(() => setMias(null));
  }, [fecha, rol]);
  useEffect(() => { if (rol) cargar(); }, [rol, cargar]);

  const t = corte?.totales;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Corte de caja</h1>
          <p className="text-sm text-gray-400 mt-1">{rol === 'taquilla' ? 'Lo que has cobrado en taquilla.' : 'Cobros de taquilla por cajero.'} Los reembolsos ya no cuentan como ventas.</p>
        </div>
        <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Día
          <input type="date" value={fecha} max={hoyGT()} onChange={(e) => e.target.value && setFecha(e.target.value)} className={`${campo} block mt-1`} />
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!corte ? !error && <p className="text-gray-400">Cargando...</p> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tarjeta destacado label="Total cobrado" valor={Q(t.total)} sub={`${t.ventas} venta(s) · ${t.boletos} boleto(s) · ${t.productos} producto(s)`} />
            <Tarjeta label="Efectivo" valor={Q(t.efectivo)} sub="Debe estar en caja" />
            <Tarjeta label="POS / tarjeta" valor={Q(t.pos)} sub="Voucher del POS" />
            <Tarjeta label="Reembolsos del día" valor={t.reembolsos} sub={t.reembolsos ? Q(t.montoReembolsos) : undefined} alerta={t.reembolsos > 0} />
          </div>

          <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <th className="px-4 py-3">Cajero</th><th className="px-4 py-3 text-right">Ventas</th><th className="px-4 py-3 text-right">Efectivo</th>
                <th className="px-4 py-3 text-right">POS</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Reembolsos</th>
              </tr></thead>
              <tbody>
                {corte.cajeros.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No hay ventas de taquilla este día.</td></tr>
                  : corte.cajeros.map((c) => (
                    <tr key={c.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums">
                      <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                      <td className="px-4 py-3 text-right">{c.ventas}</td>
                      <td className="px-4 py-3 text-right">{Q(c.efectivo)}</td>
                      <td className="px-4 py-3 text-right">{Q(c.pos)}</td>
                      <td className="px-4 py-3 text-right font-bold">{Q(c.total)}</td>
                      <td className="px-4 py-3 text-right text-neutral-400">{c.reembolsos ? `${c.reembolsos} · ${Q(c.montoReembolsos)}` : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(rol === 'taquilla' || rol === 'admin') && <CierreCaja onCerrado={() => { setRecarga((n) => n + 1); cargar(); }} />}
      {rol && <Cierres recarga={recarga} mostrarCajero={rol !== 'taquilla'} />}

      {mias && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Mis ventas de caja de este día</h2>
          {mias.ventas.length === 0 ? <p className="text-sm text-gray-500">Aún no hay ventas.</p> : (
            <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                  <th className="px-4 py-3">#</th><th className="px-4 py-3">Hora</th><th className="px-4 py-3">Detalle</th><th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" />
                </tr></thead>
                <tbody>
                  {mias.ventas.map((v) => (
                    <tr key={v.id} className="border-b border-neutral-800/60 last:border-0 tabular-nums">
                      <td className="px-4 py-3">{v.id}</td>
                      <td className="px-4 py-3">{new Date(v.saleDate).toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' })}</td>
                      <td className="px-4 py-3 text-neutral-300">{[v.boletos ? `${v.boletos} boleto(s)` : '', v.productos ? `${v.productos} producto(s)` : ''].filter(Boolean).join(' + ')}</td>
                      <td className="px-4 py-3">{METODO[v.metodo] ?? v.metodo}</td>
                      <td className="px-4 py-3 text-right font-bold">{Q(v.totalAmount)}</td>
                      <td className="px-4 py-3 text-neutral-400">{v.status === 'paid' ? 'Pagada' : v.status === 'refunded' ? 'Reembolsada' : v.status}</td>
                      <td className="px-4 py-3">{v.status === 'paid' && <BotonImprimir cargar={() => obtenerVenta(v.id)} conOpcion={false} className="text-xs font-bold uppercase tracking-wider text-purple-300 hover:text-white" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
