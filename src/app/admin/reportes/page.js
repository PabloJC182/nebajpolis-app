'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { api } from '@/lib/api';
import { lista } from '@/lib/adapters';
import { obtenerCines } from '@/lib/cine';
import { obtenerReporte, descargarCsv, hoyGT, sumarDias } from '@/lib/reportes';
import { leerUsuario } from '@/lib/roles';
import { Tarjeta, Seccion, BarrasDia, ListaBarras, MapaHorarios, Q, pct } from '@/components/admin/Graficas';

const campo = 'bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const etq = 'text-[11px] text-neutral-400 font-bold uppercase tracking-wider';
const ESTADOS = { paid: 'Pagadas', pending: 'Pendientes', expired: 'Vencidas', cancelled: 'Canceladas', refunded: 'Reembolsadas' };
const EXPORTES = [['ventas', 'Ventas'], ['boletos', 'Boletos'], ['comida', 'Comida'], ['funciones', 'Funciones y ocupación']];

const presets = () => {
  const hoy = hoyGT();
  return [
    ['Hoy', hoy, hoy], ['7 días', sumarDias(hoy, -6), hoy], ['30 días', sumarDias(hoy, -29), hoy],
    ['Este mes', `${hoy.slice(0, 8)}01`, hoy], ['90 días', sumarDias(hoy, -89), hoy],
  ];
};

function EfectividadPromos({ promos, base }) {
  if (!promos?.length) return <p className="text-sm text-gray-500">Ninguna promoción usada en este periodo.</p>;
  const ref = base?.precioPromedio ?? 0;
  return (
    <div className="space-y-3">
      {promos.map((p) => {
        const dif = ref ? (p.precioPromedio - ref) / ref : null;
        return (
          <div key={p.id} className="border border-neutral-800 rounded-lg p-3">
            <p className="font-bold text-sm">{p.name}</p>
            <p className="text-xs text-gray-400 mt-1">{p.usos} uso(s) · {p.boletos} boleto(s) · {Q(p.ingresos)} ingresos</p>
            <p className="text-xs text-gray-400">Descuento otorgado {Q(p.descuento)} · precio promedio {Q(p.precioPromedio)}{dif !== null ? ` (${dif >= 0 ? '+' : ''}${(dif * 100).toFixed(0)}% vs. sin promoción)` : ''}</p>
          </div>
        );
      })}
      {base && <p className="text-[11px] text-neutral-500">Sin promoción: {base.boletos} boleto(s) · precio promedio {Q(base.precioPromedio)}.</p>}
    </div>
  );
}

export default function ReportesPage() {
  const [f, setF] = useState(() => ({ desde: sumarDias(hoyGT(), -29), hasta: hoyGT(), cineId: '', peliculaId: '', canal: '', tipo: '' }));
  const [r, setR] = useState(null);
  const [cines, setCines] = useState([]);
  const [peliculas, setPeliculas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [pii, setPii] = useState(false);
  const [exportando, setExportando] = useState('');

  useEffect(() => {
    setEsAdmin(leerUsuario()?.role === 'admin');
    obtenerCines().then(setCines).catch(() => {});
    api('/movies').then((m) => setPeliculas(lista(m).map((x) => ({ id: x.id, title: x.title })).sort((a, b) => a.title.localeCompare(b.title)))).catch(() => {});
  }, []);

  useEffect(() => {
    if (f.desde > f.hasta) { setError('La fecha inicial no puede ser mayor que la final.'); return; }
    let vivo = true;
    setCargando(true); setError('');
    obtenerReporte(f).then((d) => vivo && setR(d)).catch((e) => vivo && setError(e.message)).finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, [f]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const exportar = async (tipo) => {
    setExportando(tipo); setError('');
    try { await descargarCsv(tipo, f, { pii: esAdmin && pii }); } catch (e) { setError(e.message); }
    finally { setExportando(''); }
  };

  const ocupacion = useMemo(() => (r ? [...r.ocupacion].sort((a, b) => a.porcentaje - b.porcentaje) : []), [r]);
  const k = r?.kpi;
  const embudo = r ? r.embudo.map((e) => ({ ...e, label: ESTADOS[e.status] ?? e.status })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Reportes</h1>
        <p className="text-sm text-gray-400 mt-1">Ingresos netos: ya excluyen las ventas reembolsadas. Fechas en hora de Guatemala.</p>
      </div>

      <section className="bg-[#121318] border border-neutral-800/80 rounded-xl p-4 space-y-4" aria-label="Filtros">
        <div className="flex flex-wrap gap-2">
          {presets().map(([n, d, h]) => (
            <button key={n} onClick={() => setF((p) => ({ ...p, desde: d, hasta: h }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${f.desde === d && f.hasta === h ? 'bg-purple-600 border-purple-500' : 'border-neutral-700 text-neutral-400 hover:text-white'}`}>{n}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <label className={etq}>Desde<input type="date" value={f.desde} max={f.hasta} onChange={set('desde')} className={`${campo} block w-full mt-1`} /></label>
          <label className={etq}>Hasta<input type="date" value={f.hasta} min={f.desde} onChange={set('hasta')} className={`${campo} block w-full mt-1`} /></label>
          <label className={etq}>Cine
            <select value={f.cineId} onChange={set('cineId')} className={`${campo} block w-full mt-1`}><option value="">Todos</option>{cines.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className={etq}>Película
            <select value={f.peliculaId} onChange={set('peliculaId')} className={`${campo} block w-full mt-1`}><option value="">Todas</option>{peliculas.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
          <label className={etq}>Canal
            <select value={f.canal} onChange={set('canal')} className={`${campo} block w-full mt-1`}><option value="">Todos</option><option value="online">Web</option><option value="box_office">Taquilla</option></select></label>
          <label className={etq}>Tipo
            <select value={f.tipo} onChange={set('tipo')} className={`${campo} block w-full mt-1`}><option value="">Todos</option><option value="tickets">Boletos (con o sin comida)</option><option value="food">Solo dulcería</option></select></label>
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!r ? !error && <p className="text-gray-400">Cargando reporte...</p> : (
        <div className={`space-y-6 transition-opacity ${cargando ? 'opacity-50' : ''}`} aria-busy={cargando}>
          {k.ventas === 0 && (
            <p className="text-sm bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg px-4 py-3">
              No hay ventas pagadas en este periodo. Prueba con “Últimos 30 días” o “Este mes” para ver tendencias.
            </p>
          )}

          <div>
            <h2 className="text-lg font-black tracking-tight">Indicadores clave</h2>
            <p className="text-xs text-gray-500 mt-0.5">Películas más vistas, horarios de mayor demanda y efectividad de promociones, según el filtro elegido.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <Seccion titulo="1 · Películas más vistas" derecha={<span className="text-[11px] text-neutral-500">por boletos</span>}>
              <ListaBarras items={r.porPelicula} etiqueta={(p) => p.title} valor={(p) => p.boletos} formato={(p) => `${p.boletos} boletos · ${Q(p.ingresos)}`} vacio="Sin boletos vendidos en este periodo." />
            </Seccion>
            <Seccion titulo="2 · Horarios de mayor demanda" derecha={<span className="text-[11px] text-neutral-500">boletos por día y hora</span>}>
              <MapaHorarios datos={r.porHorario} />
            </Seccion>
            <Seccion titulo="3 · Efectividad de promociones">
              <EfectividadPromos promos={r.promociones} base={r.sinPromo} />
            </Seccion>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tarjeta destacado label="Ingresos netos" valor={Q(k.ingresos)} sub={`${k.ventas} venta(s) · promedio ${Q(k.ticketPromedio)}`} />
            <Tarjeta label="Boletos vendidos" valor={k.boletos} sub={`${Q(k.ingresosBoletos)} · ${k.usados} usados · ${k.noShow} sin usar (función pasada)`} />
            <Tarjeta label="Dulcería" valor={Q(k.ingresosComida)} sub={`${pct(k.porcentajeConComida)} de las compras de boletos llevan comida · ${k.pedidosDulceria} pedido(s) solo comida`} />
            <Tarjeta label="Ocupación promedio" valor={pct(k.ocupacionPromedio, 1)} sub={`${k.funciones} función(es) en el periodo`} />
            <Tarjeta label="Descuentos otorgados" valor={Q(k.descuentos)} sub={`Precio base menos precio pagado${k.descuentosCuponesCombos ? ` · cupones y combos ${Q(k.descuentosCuponesCombos)}` : ''}`} />
            <Tarjeta label="Reembolsos" valor={k.reembolsos} sub={k.reembolsos ? `${Q(k.montoReembolsado)} devueltos` : 'Sin reembolsos'} alerta={k.reembolsos > 0} />
            <Tarjeta alerta={r.comidaPendiente.pedidos > 0} label="Comida por canjear" valor={Q(r.comidaPendiente.monto)}
              sub={`${r.comidaPendiente.pedidos} pedido(s) vigentes (QR de 6 meses)${r.comidaPendiente.vencidos ? ` · ${r.comidaPendiente.vencidos} vencido(s): ${Q(r.comidaPendiente.montoVencido)}` : ''}`} />
            <Tarjeta label="Embudo web" valor={`${embudo.find((e) => e.status === 'paid')?.total ?? 0} pagadas`}
              sub={embudo.filter((e) => e.status !== 'paid').map((e) => `${e.total} ${e.label.toLowerCase()}`).join(' · ') || 'Sin ventas web'} />
          </div>

          <Seccion titulo="Ingresos por día" derecha={<span className="text-sm font-bold tabular-nums">{Q(k.ingresos)}</span>}>
            <BarrasDia datos={r.porDia} valor={(d) => d.ingresos} detalle={(d) => `${d.dia}: ${Q(d.ingresos)} · ${d.ventas} venta(s) · ${d.boletos} boleto(s)`} />
          </Seccion>

          <div className="grid lg:grid-cols-2 gap-6">
            <Seccion titulo="Por cine">
              <ListaBarras items={r.porCine} etiqueta={(c) => c.name} valor={(c) => c.ingresos} formato={(c) => `${c.ventas} ventas · ${Q(c.ingresos)}`} />
            </Seccion>
            <Seccion titulo="Por canal">
              <ListaBarras items={r.canales} etiqueta={(c) => c.canal} valor={(c) => c.ingresos} formato={(c) => `${c.ventas} ventas · ${Q(c.ingresos)}`} />
            </Seccion>
            <Seccion titulo="Dulcería: productos">
              <ListaBarras items={r.comida} etiqueta={(c) => c.name} valor={(c) => c.ingresos} formato={(c) => `${c.unidades} uds · ${Q(c.ingresos)}`} vacio="Sin ventas de comida en este periodo." />
            </Seccion>
            <Seccion titulo="Cupones usados">
              <ListaBarras items={r.cupones ?? []} etiqueta={(c) => c.code} valor={(c) => c.usos} formato={(c) => `${c.usos} usos · −${Q(c.descuento)}`} vacio="Ningún cupón usado en este periodo." />
            </Seccion>
            <Seccion titulo="Combos vendidos">
              <ListaBarras items={r.combos ?? []} etiqueta={(c) => c.name} valor={(c) => c.ventas} formato={(c) => `${c.ventas} ventas · ${Q(c.ingresos)}`} vacio="Ningún combo vendido en este periodo." />
            </Seccion>
          </div>

          <Seccion titulo={`Ocupación por función (${ocupacion.length})`} derecha={<span className="text-[11px] text-neutral-500">de menor a mayor</span>}>
            <p className="text-xs text-gray-500 mb-3">Se miden las funciones que ocurren dentro del periodo (por la fecha de la función, no de la compra). Las ventas de hoy para funciones futuras aparecen cuando llegue esa fecha.</p>
            {ocupacion.length === 0 ? <p className="text-sm text-gray-500">No hay funciones en este periodo.</p> : (
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#121318]"><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                    <th className="py-2 pr-3">Película</th><th className="py-2 pr-3">Función</th><th className="py-2 pr-3">Sala</th><th className="py-2 pr-3 text-right">Vendidos</th><th className="py-2 text-right">Ocupación</th>
                  </tr></thead>
                  <tbody>
                    {ocupacion.map((o) => (
                      <tr key={o.id} className="border-b border-neutral-800/60 tabular-nums">
                        <td className="py-2 pr-3 font-semibold">{o.title}</td>
                        <td className="py-2 pr-3 text-neutral-300">{new Date(o.showDatetime).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Guatemala' })}</td>
                        <td className="py-2 pr-3 text-neutral-400">{o.cine} · {o.sala}</td>
                        <td className="py-2 pr-3 text-right">{o.vendidos}/{o.capacidad}</td>
                        <td className="py-2 text-right font-bold">{pct(o.porcentaje)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>

          <Seccion titulo="Exportar (CSV, abre en Excel y Google Sheets)">
            <div className="flex flex-wrap items-center gap-3">
              {EXPORTES.map(([tipo, label]) => (
                <button key={tipo} onClick={() => exportar(tipo)} disabled={!!exportando}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-700 hover:border-white text-xs font-bold uppercase tracking-wider disabled:opacity-50">
                  <Download size={14} /> {exportando === tipo ? 'Generando...' : label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-3">Usa los filtros de arriba (las funciones se filtran por la fecha de la función).</p>
            {esAdmin && (
              <label className="flex items-center gap-2 text-xs text-neutral-300 mt-3 cursor-pointer">
                <input type="checkbox" checked={pii} onChange={(e) => setPii(e.target.checked)} />
                Incluir nombre y correo de los clientes en el exporte de ventas (datos personales: no lo compartas con terceros)
              </label>
            )}
          </Seccion>
        </div>
      )}
    </div>
  );
}
