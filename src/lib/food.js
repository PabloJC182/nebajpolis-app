import { api } from '@/lib/api';
import { EP, USE_MOCK } from '@/lib/endpoints';
import { lista } from '@/lib/adapters';

const MOCK = [
  { id: '1', name: 'Palomitas Grandes', description: 'Con mantequilla', category: 'Palomitas', price: 35, imageUrl: '' },
  { id: '2', name: 'Refresco Grande', description: 'Gaseosa a elección', category: 'Bebidas', price: 20, imageUrl: '' },
  { id: '3', name: 'Combo Pareja', description: '1 palomitas grandes + 2 refrescos', category: 'Combos', price: 70, imageUrl: '' },
];

export async function obtenerComida() {
  if (USE_MOCK) return MOCK;
  return lista(await api(EP.food)).map((c) => ({
    id: String(c.id),
    name: c.name,
    description: c.description ?? '',
    category: c.category || 'Otros',
    price: Number(c.price),
    imageUrl: c.imageUrl || '',
  }));
}