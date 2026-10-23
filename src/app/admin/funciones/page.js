'use client';

import CrudTable, { aLocal } from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Funciones',
  listar: async () => { const r = await api('/shows'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Película', render: (s) => <span className="font-semibold">{s.movie?.title}</span> },
    { label: 'Sala', render: (s) => `${s.room?.cinema?.name ?? ''} · ${s.room?.name ?? ''}` },
    { label: 'Fecha y hora', render: (s) => new Date(s.showDatetime).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) },
    { label: 'Formato', render: (s) => s.format },
    { label: 'Precio', render: (s) => `Q${Number(s.basePrice).toFixed(2)}` },
    { label: 'Estado', render: (s) => (s.status ? 'Activa' : 'Inactiva') },
  ],
  campos: [
    { name: 'movieId', label: 'Película', type: 'select', required: true, cargar: async () => (await api('/movies')).map((m) => ({ value: m.id, label: m.title })) },
    { name: 'roomId', label: 'Sala', type: 'select', required: true, cargar: async () => (await api('/rooms')).map((r) => ({ value: r.id, label: `${r.cinema?.name ?? ''} · ${r.name}` })) },
    { name: 'showDatetime', label: 'Fecha y hora', type: 'datetime-local', required: true },
    { name: 'basePrice', label: 'Precio base (Q)', type: 'number', required: true },
    { name: 'format', label: 'Formato (subtitulada, doblada, 3D...)' },
    { name: 'status', label: 'Activa', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, format: 'subtitulada' }),
  aFormulario: (s) => ({ ...s, showDatetime: aLocal(s.showDatetime) }),
  aPayload: (f) => ({
    movieId: Number(f.movieId), roomId: Number(f.roomId), showDatetime: new Date(f.showDatetime).toISOString(),
    basePrice: Number(f.basePrice), format: f.format, status: !!f.status,
  }),
  crear: (p) => api('/shows/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/shows/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/shows/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
