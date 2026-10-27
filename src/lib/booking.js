import { api } from '@/lib/api';
import { guardarTokenInvitado } from '@/lib/guest';
import { EP, USE_MOCK } from '@/lib/endpoints';
import { adaptarFuncion, adaptarAsiento, lista } from '@/lib/adapters';
import { MOVIES_DATA } from '@/data/movies.mock';

const mockFuncion = (id) => ({
  id, movieId: MOVIES_DATA[0].id, movie: MOVIES_DATA[0], room: 'Sala 1',
  date: '14', month: 'DIC', time: '9:40 pm', format: 'IMAX 3D', pricePerSeat: 45, currency: 'Q',
});
const mockAsientos = () =>
  'ABCDEFGHIJ'.split('').flatMap((row) =>
    Array.from({ length: 12 }, (_, i) => ({
      id: `${row}${i + 1}`, label: `${row}${i + 1}`, row, number: i + 1,
      status: ['C5', 'C6', 'D7', 'E4', 'E5', 'F6', 'G3', 'H8'].includes(`${row}${i + 1}`) ? 'occupied' : 'available',
    })));

export async function obtenerFuncion(id) {
  if (USE_MOCK) return mockFuncion(id);
  return adaptarFuncion(await api(EP.show(id)));
}

export async function obtenerFuncionesDePelicula(movieId) {
  if (USE_MOCK) return [mockFuncion('1'), { ...mockFuncion('2'), time: '6:15 pm', format: '2D' }];
  return lista(await api(EP.showsByMovie(movieId))).map(adaptarFuncion);
}

// Funciones que aún no empiezan (para filtrar la cartelera por cine, formato y día)
export async function obtenerFuncionesProximas() {
  if (USE_MOCK) return [];
  return lista(await api('/shows?upcoming=1')).map(adaptarFuncion);
}

export async function obtenerAsientos(showId) {
  if (USE_MOCK) return mockAsientos();
  return lista(await api(EP.showSeats(showId))).map(adaptarAsiento);
}

// Crea la venta (el backend bloquea los asientos). Responde { sale: { id } }
export async function crearVenta(showId, seatIds, foodItems = [], promotionId = null, invitado = null, extra = {}) {
  if (USE_MOCK) return { id: 'mock-sale' };
  const r = await api(EP.salesCreate, {
    method: 'POST',
    body: JSON.stringify({
      showId: Number(showId),
      seatIds: seatIds.map(Number),
      ...(promotionId ? { promotionId: Number(promotionId) } : {}),
      ...(extra.comboId ? { comboId: Number(extra.comboId), comboQty: extra.comboQty || 1 } : {}),
      ...(extra.couponCode ? { couponCode: extra.couponCode } : {}),
      foodItems: foodItems.map((f) => ({ foodItemId: Number(f.foodItemId), quantity: f.quantity })),
      ...(invitado ? { guestEmail: invitado.email, guestName: invitado.nombre } : {}),
    }),
  });
  if (r.guestToken) guardarTokenInvitado(r.sale.id, r.guestToken);
  return { ...r.sale, expiresAt: r.expiresAt };
}

// Pedido solo de dulcería: se paga en línea y se recoge en el cine con un QR
export async function crearPedidoComida(cinemaId, foodItems, invitado = null, extra = {}) {
  const r = await api('/sales/create-food', {
    method: 'POST',
    body: JSON.stringify({
      cinemaId: Number(cinemaId),
      ...(extra.couponCode ? { couponCode: extra.couponCode } : {}),
      foodItems: foodItems.map((f) => ({ foodItemId: Number(f.foodItemId), quantity: f.quantity })),
      ...(invitado ? { guestEmail: invitado.email, guestName: invitado.nombre } : {}),
    }),
  });
  if (r.guestToken) guardarTokenInvitado(r.sale.id, r.guestToken);
  return { ...r.sale, expiresAt: r.expiresAt };
}

// Payment Intent de Stripe para una venta
export const crearPaymentIntent = (saleId) =>
  api(EP.paymentIntent, { method: 'POST', body: JSON.stringify({ saleId: Number(saleId) }) });
export const obtenerVenta = (id) => api(EP.sale(id));
// Ventas del usuario autenticado
export const obtenerMisVentas = async () => (USE_MOCK ? [] : lista(await api(EP.misVentas)));
