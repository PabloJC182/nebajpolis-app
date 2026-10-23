'use client';

import CrudTable, { aLocal } from '@/components/admin/CrudTable';
import { api } from '@/lib/api';
import { diasLista, diasTexto } from '@/lib/promotions';

const DIAS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mié'], [4, 'Jue'], [5, 'Vie'], [6, 'Sáb'], [0, 'Dom']].map(([value, label]) => ({ value, label }));

const json = (b) => JSON.stringify(b);
const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-GT') : '—');
const cfg = {
  titulo: 'Promociones',
  listar: async () => { const r = await api('/promotions'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Nombre', render: (p) => <span className="font-semibold">{p.name}</span> },
    { label: 'Descuento', render: (p) => `${Number(p.discountPercentage)}%` },
    { label: 'Días', render: (p) => (diasLista(p.validDays).length ? diasTexto(diasLista(p.validDays)) : 'Todos') },
    { label: 'Desde', render: (p) => fecha(p.validFrom) },
    { label: 'Hasta', render: (p) => fecha(p.validTo) },
    { label: 'Estado', render: (p) => (p.status ? 'Activa' : 'Inactiva') },
  ],
  campos: [
    { name: 'name', label: 'Nombre', required: true },
    { name: 'description', label: 'Descripción', type: 'textarea' },
    { name: 'discountPercentage', label: 'Descuento (%)', type: 'number', required: true },
    { name: 'validDays', label: 'Días de la función en que aplica (vacío = todos)', type: 'multi', cargar: async () => DIAS },
    { name: 'validFrom', label: 'Vigente desde', type: 'datetime-local', required: true },
    { name: 'validTo', label: 'Vigente hasta', type: 'datetime-local', required: true },
    { name: 'status', label: 'Activa', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, validDays: [] }),
  aFormulario: (p) => ({ ...p, validDays: diasLista(p.validDays), validFrom: aLocal(p.validFrom), validTo: aLocal(p.validTo) }),
  aPayload: (f) => ({
    name: f.name, description: f.description, discountPercentage: Number(f.discountPercentage),
    validFrom: new Date(f.validFrom).toISOString(), validTo: new Date(f.validTo).toISOString(), validDays: f.validDays ?? [], status: !!f.status,
  }),
  crear: (p) => api('/promotions/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/promotions/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/promotions/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() { return <CrudTable cfg={cfg} />; }
