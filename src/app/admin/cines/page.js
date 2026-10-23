'use client';

import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Cines',
  listar: async () => { const r = await api('/cinemas'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Nombre', render: (c) => <span className="font-semibold">{c.name}</span> },
    { label: 'Ciudad', render: (c) => c.city || '—' },
    { label: 'Dirección', render: (c) => c.address || '—' },
    { label: 'Teléfono', render: (c) => c.phone || '—' },
  ],
  campos: [
    { name: 'name', label: 'Nombre', required: true },
    { name: 'city', label: 'Ciudad' },
    { name: 'address', label: 'Dirección' },
    { name: 'phone', label: 'Teléfono' },
  ],
  vacio: () => ({}),
  aFormulario: (c) => ({ name: c.name ?? '', city: c.city ?? '', address: c.address ?? '', phone: c.phone ?? '' }),
  aPayload: (f) => ({ name: f.name.trim(), city: f.city?.trim(), address: f.address?.trim(), phone: f.phone?.trim() }),
  crear: (p) => api('/cinemas/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/cinemas/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/cinemas/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
