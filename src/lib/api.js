import { tokenInvitado } from '@/lib/guest';
// Cliente HTTP hacia cine-api (los errores del back traen { message })
// Acepta la URL con o sin "/api" al final (el back cuelga todo de /api)
const BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://nebajpolis-api.onrender.com/api').replace(/\/+$/, '');
export const API_URL = BASE.endsWith('/api') ? BASE : `${BASE}/api`;

// Id de venta al que se refiere la peticion (para adjuntar el token de invitado)
function ventaDe(ruta, opciones) {
  const m = ruta.match(/\/sales\/(\d+)/);
  if (m) return m[1];
  try { const b = JSON.parse(opciones.body || 'null'); return b?.saleId ?? null; } catch { return null; }
}

export async function api(ruta, opciones = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const guest = typeof window !== 'undefined' ? tokenInvitado(ventaDe(ruta, opciones)) : null;
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      cache: 'no-store', // evita que Next cachee datos viejos
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(guest && { 'x-guest-token': guest }),
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error(`No se pudo conectar con la API (${API_URL}). Revisa que esté corriendo y el CORS_ORIGIN.`);
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401 && typeof window !== 'undefined') localStorage.removeItem('token');
    const error = new Error(datos.message || `Error ${respuesta.status} en ${opciones.method ?? 'GET'} ${API_URL}${ruta}`);
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
  }
  return datos;
}
