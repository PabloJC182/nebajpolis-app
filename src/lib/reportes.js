import { api, API_URL } from '@/lib/api';

export const hoyGT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
export const sumarDias = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export const aQuery = (f) => {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : v); });
  return p.toString();
};

export const obtenerReporte = (f) => api(`/reportes/resumen?${aQuery(f)}`);
export const obtenerCorte = (fecha, cajeroId) => api(`/reportes/corte-caja?${aQuery({ fecha, cajeroId })}`);

// Descarga un CSV (la API exige el token en la cabecera, por eso no es un simple enlace)
export async function descargarCsv(tipo, filtros, { pii = false } = {}) {
  const token = localStorage.getItem('token');
  const r = await fetch(`${API_URL}/reportes/exportar/${tipo}.csv?${aQuery({ ...filtros, pii })}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || `Error ${r.status} al exportar`);
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url;
  // El nombre se arma aquí: el navegador no deja leer Content-Disposition en peticiones entre dominios
  a.download = `nebajpolis-${tipo}-${filtros.desde}_a_${filtros.hasta}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
