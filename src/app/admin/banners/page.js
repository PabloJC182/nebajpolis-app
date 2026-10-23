'use client';

import CrudTable, { aLocal } from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Banners del inicio',
  listar: async () => { const r = await api('/banners/todos'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Imagen', render: (b) => <img src={b.imageUrl} alt="" className="w-24 h-10 object-cover rounded border border-neutral-700" /> },
    { label: 'Título', render: (b) => <span className="font-semibold">{b.title}</span> },
    { label: 'Enlace', render: (b) => b.linkUrl || '—' },
    { label: 'Orden', render: (b) => b.sortOrder },
    { label: 'Estado', render: (b) => (b.status ? 'Activo' : 'Oculto') },
  ],
  campos: [
    { name: 'title', label: 'Título', required: true },
    { name: 'subtitle', label: 'Subtítulo (opcional)' },
    { name: 'imageUrl', label: 'URL de la imagen (ideal 1920×550)', required: true },
    { name: 'linkUrl', label: 'Enlace al hacer clic (/promociones o https://...)' },
    { name: 'buttonText', label: 'Texto del botón (por defecto "Ver más")' },
    { name: 'sortOrder', label: 'Orden (menor aparece primero)', type: 'number' },
    { name: 'validFrom', label: 'Mostrar desde (opcional)', type: 'datetime-local' },
    { name: 'validTo', label: 'Mostrar hasta (opcional)', type: 'datetime-local' },
    { name: 'status', label: 'Activo', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, sortOrder: 0 }),
  aFormulario: (b) => ({ ...b, linkUrl: b.linkUrl ?? '', subtitle: b.subtitle ?? '', buttonText: b.buttonText ?? '', validFrom: aLocal(b.validFrom), validTo: aLocal(b.validTo) }),
  aPayload: (f) => ({
    title: f.title, subtitle: f.subtitle, imageUrl: f.imageUrl, linkUrl: f.linkUrl, buttonText: f.buttonText,
    sortOrder: Number(f.sortOrder) || 0,
    validFrom: f.validFrom ? new Date(f.validFrom).toISOString() : null,
    validTo: f.validTo ? new Date(f.validTo).toISOString() : null,
    status: !!f.status,
  }),
  crear: (p) => api('/banners/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/banners/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/banners/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
