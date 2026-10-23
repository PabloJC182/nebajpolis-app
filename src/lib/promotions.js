import { api } from '@/lib/api';
import { EP, USE_MOCK } from '@/lib/endpoints';
import { lista, diaGT } from '@/lib/adapters';

const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
// "2,5" | [2,5] | null -> [2,5] (0 = domingo ... 6 = sábado); vacío = todos los días
export const diasLista = (v) => (Array.isArray(v) ? v : String(v ?? '').split(',')).map((x) => parseInt(x, 10)).filter((n) => n >= 0 && n <= 6);
export const diasTexto = (dias = []) => {
  const d = dias.map((n) => NOMBRES[n]);
  return d.length <= 1 ? d[0] ?? '' : `${d.slice(0, -1).join(', ')} y ${d[d.length - 1]}`;
};
const diaSemana = (dayKey) => new Date(`${dayKey}T12:00:00Z`).getUTCDay();
// ¿La promo aplica a una función de ese día (YYYY-MM-DD, hora de Guatemala)?
export const aplicaEnDia = (promo, dayKey) => !promo?.validDays?.length || promo.validDays.includes(diaSemana(dayKey));
export const aplicaHoy = (promo) => aplicaEnDia(promo, diaGT(new Date()));

const MOCK = [
  { id: '1', name: 'Martes 2x1', description: 'Todos los martes en funciones 2D', discount: 50, validFrom: null, validTo: null, validDays: [2] },
];

export async function obtenerPromociones() {
  if (USE_MOCK) return MOCK;
  return lista(await api(EP.promosVigentes)).map((p) => ({
    id: String(p.id),
    name: p.name,
    description: p.description ?? '',
    discount: Number(p.discountPercentage),
    validFrom: p.validFrom,
    validTo: p.validTo,
    validDays: diasLista(p.validDays),
  }));
}

// Promoción elegida por el usuario (se aplica en la siguiente compra)
export const promoElegida = () => {
  try { return JSON.parse(localStorage.getItem('promo') || 'null'); } catch { return null; }
};
export const elegirPromo = (p) => { try { localStorage.setItem('promo', JSON.stringify({ id: p.id, name: p.name, discount: p.discount, validDays: p.validDays ?? [] })); } catch {} };
export const limpiarPromo = () => { try { localStorage.removeItem('promo'); } catch {} };
