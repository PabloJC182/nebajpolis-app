import { api } from '@/lib/api';
import { lista } from '@/lib/adapters';

// Combos vigentes: N boletos + productos de dulcería a un precio especial
export async function obtenerCombos() {
  return lista(await api('/combos')).map((c) => ({
    id: String(c.id),
    name: c.name,
    description: c.description ?? '',
    imageUrl: c.imageUrl || '',
    ticketQty: c.ticketQty,
    price: Number(c.price),
    items: (c.items ?? []).map((i) => ({ foodItemId: String(i.foodItemId), quantity: i.quantity, name: i.name, price: Number(i.price) })),
    precioComida: Number(c.precioComida ?? 0),
  }));
}

// Cuánto vale por separado lo que incluye (para mostrar el ahorro)
export const precioLista = (combo, precioBoleto) => combo.ticketQty * precioBoleto + combo.precioComida;

// Vista previa de un cupón en el servidor (el cobro real vuelve a validarlo)
export const validarCupon = (code, subBoletos, subComida, guestEmail) =>
  api('/cupones/validar', { method: 'POST', body: JSON.stringify({ code, subBoletos, subComida, ...(guestEmail ? { guestEmail } : {}) }) });
