'use client';

import CrudTable, { aLocal } from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Funciones',
  // Primero las que vienen (la más próxima arriba) y al final las pasadas (la más reciente primero)
  listar: async () => {
    const r = await api('/shows');
    const corte = Date.now() - 30 * 60 * 1000;
    const t = (s) => new Date(s.showDatetime).getTime();
    const todas = Array.isArray(r) ? r : [];
    return [...todas.filter((s) => t(s) >= corte).sort((a, b) => t(a) - t(b)), ...todas.filter((s) => t(s) < corte).sort((a, b) => t(b) - t(a))];
  },
  columnas: [
    { label: 'Película', render: (s) => <span className="font-semibold">{s.movie?.title}</span> },
    { label: 'Sala', render: (s) => `${s.room?.cinema?.name ?? ''} · ${s.room?.name ?? ''}` },
    { label: 'Fecha y hora', render: (s) => new Date(s.showDatetime).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) },
    { label: 'Formato', render: (s) => s.format },
    { label: 'Precio', render: (s) => `Q${Number(s.basePrice).toFixed(2)}` },
    { label: 'Estado', render: (s) => (new Date(s.showDatetime).getTime() < Date.now() - 30 * 60 * 1000 ? <span className="text-neutral-500">Pasada</span> : s.status ? 'Activa' : 'Inactiva') },
  ],
  campos: [
    { name: 'movieId', label: 'Película', type: 'select', required: true, cargar: async () => (await api('/movies')).map((m) => ({ value: m.id, label: m.title })) },
    { name: 'roomId', label: 'Sala', type: 'select', required: true, cargar: async () => (await api('/rooms')).map((r) => ({ value: r.id, label: `${r.cinema?.name ?? ''} · ${r.name}` })) },
    // Al crear no se aceptan horas que ya pasaron (al editar, el servidor rechaza mover la función al pasado)
    { name: 'showDatetime', label: 'Fecha y hora', type: 'datetime-local', required: true, min: (f) => (f.id ? undefined : aLocal(new Date())) },
    { name: 'basePrice', label: 'Precio base (Q)', type: 'number', required: true },
    { name: 'format', label: 'Formato (subtitulada, doblada, 3D...)' },
    { name: 'promotionIds', label: 'Promociones de esta función (vacío = aplican las vigentes del día)', type: 'multi', cargar: async () => (await api('/promotions')).map((x) => ({ value: x.id, label: x.name })) },
    { name: 'status', label: 'Activa', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, format: 'subtitulada', promotionIds: [] }),
  aFormulario: (s) => ({ ...s, showDatetime: aLocal(s.showDatetime), promotionIds: (s.promotions ?? []).map((x) => x.id) }),
  aPayload: (f) => ({
    movieId: Number(f.movieId), roomId: Number(f.roomId), showDatetime: new Date(f.showDatetime).toISOString(),
    basePrice: Number(f.basePrice), format: f.format, status: !!f.status, promotionIds: (f.promotionIds ?? []).map(Number),
  }),
  crear: (p) => api('/shows/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/shows/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/shows/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
