'use client';

import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Comida',
  listar: async () => { const r = await api('/food/todos'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Imagen', render: (c) => c.imageUrl ? <img src={c.imageUrl} alt="" className="w-12 h-12 object-cover rounded" /> : '🍿' },
    { label: 'Nombre', render: (c) => <span className="font-semibold">{c.name}</span> },
    { label: 'Categoría', render: (c) => c.category },
    { label: 'Precio', render: (c) => `Q${Number(c.price).toFixed(2)}` },
    { label: 'Estado', render: (c) => (c.status ? 'Disponible' : 'Oculto') },
  ],
  campos: [
    { name: 'name', label: 'Nombre', required: true },
    { name: 'description', label: 'Descripción', type: 'textarea' },
    { name: 'category', label: 'Categoría (Palomitas, Bebidas, Combos...)' },
    { name: 'price', label: 'Precio (Q)', type: 'number', required: true },
    { name: 'imageUrl', label: 'URL de la imagen' },
    { name: 'status', label: 'Disponible', type: 'checkbox' },
  ],
  vacio: () => ({ status: true }),
  aFormulario: (c) => ({ ...c }),
  aPayload: (f) => ({ name: f.name, description: f.description, category: f.category || 'Otros', price: Number(f.price), imageUrl: f.imageUrl, status: !!f.status }),
  crear: (p) => api('/food/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/food/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/food/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
