'use client';

import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Personas',
  listar: async () => { const r = await api('/persons'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Foto', render: (p) => p.photoUrl ? <img src={p.photoUrl} alt="" className="w-10 h-12 object-cover rounded" /> : '—' },
    { label: 'Nombre', render: (p) => <span className="font-semibold">{p.fullName}</span> },
    { label: 'Películas', render: (p) => <span className="font-bold tabular-nums">{p.movieCount ?? 0}</span> },
    { label: 'Nacimiento', render: (p) => p.birthDate ? new Date(p.birthDate).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : '—' },
    { label: 'Biografía', render: (p) => <span className="text-gray-400 line-clamp-2 max-w-xs block">{p.biography || '—'}</span> },
  ],
  campos: [
    { name: 'fullName', label: 'Nombre completo', required: true },
    { name: 'photoUrl', label: 'URL de la foto (PNG/WebP con fondo transparente)' },
    { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
    { name: 'biography', label: 'Biografía', type: 'textarea' },
  ],
  vacio: () => ({}),
  aFormulario: (p) => ({ ...p, birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : '' }),
  aPayload: (f) => ({ fullName: f.fullName, photoUrl: f.photoUrl || null, birthDate: f.birthDate || null, biography: f.biography || null }),
  crear: (p) => api('/persons/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/persons/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/persons/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
