'use client';

import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';
import { aLocal } from '@/components/admin/CrudTable';

const json = (b) => JSON.stringify(b);
const cfg = {
  titulo: 'Películas',
  listar: async () => { const r = await api('/movies'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Póster', render: (m) => m.posterUrl ? <img src={m.posterUrl} alt="" className="w-10 h-14 object-cover rounded" /> : '—' },
    { label: 'Título', render: (m) => <span className="font-semibold">{m.title}</span> },
    { label: 'Duración', render: (m) => `${m.durationMinutes} min` },
    { label: 'Géneros', render: (m) => (m.genres ?? []).map((g) => g.name).join(', ') || '—' },
    { label: 'Estado', render: (m) => (m.status ? 'Activa' : 'Inactiva') },
  ],
  campos: [
    { name: 'title', label: 'Título', required: true },
    { name: 'synopsis', label: 'Sinopsis', type: 'textarea' },
    { name: 'durationMinutes', label: 'Duración (min)', type: 'number', required: true },
    { name: 'releaseDate', label: 'Fecha de estreno', type: 'date' },
    { name: 'rating', label: 'Clasificación (ej. B, B15, C)' },
    { name: 'originalLanguage', label: 'Idioma original' },
    { name: 'posterUrl', label: 'URL del póster' },
    { name: 'backdropUrl', label: 'URL del fondo' },
    { name: 'trailerUrl', label: 'URL del tráiler (YouTube)' },
    { name: 'genreIds', label: 'Géneros', type: 'multi', cargar: async () => (await api('/genres')).map((g) => ({ value: g.id, label: g.name })) },
    { name: 'status', label: 'Activa', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, genreIds: [] }),
  aFormulario: (m) => ({ ...m, releaseDate: m.releaseDate ? String(m.releaseDate).slice(0, 10) : '', genreIds: (m.genres ?? []).map((g) => g.id) }),
  aPayload: (f) => ({
    title: f.title, synopsis: f.synopsis, durationMinutes: Number(f.durationMinutes),
    releaseDate: f.releaseDate || null, rating: f.rating, originalLanguage: f.originalLanguage,
    posterUrl: f.posterUrl, backdropUrl: f.backdropUrl, trailerUrl: f.trailerUrl || null, status: !!f.status, genreIds: (f.genreIds ?? []).map(Number),
  }),
  crear: (p) => api('/movies/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/movies/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/movies/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
