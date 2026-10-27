'use client';

import CrudTable, { aLocal } from '@/components/admin/CrudTable';
import { api } from '@/lib/api';

const json = (b) => JSON.stringify(b);
const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-GT') : '—');
const ALCANCE = { all: 'Todo', tickets: 'Solo boletos', food: 'Solo dulcería' };
const OPC_ALCANCE = Object.entries(ALCANCE).map(([value, label]) => ({ value, label }));
const OPC_TIPO = [{ value: 'percent', label: 'Porcentaje (%)' }, { value: 'fixed', label: 'Monto fijo (Q)' }];
const vacioNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

const cfg = {
  titulo: 'Cupones',
  listar: async () => { const r = await api('/cupones'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: 'Código', render: (c) => <span className="font-mono font-bold tracking-wider">{c.code}</span> },
    { label: 'Descuento', render: (c) => (c.type === 'fixed' ? `Q${Number(c.value).toFixed(2)}` : `${Number(c.value)}%`) },
    { label: 'Aplica a', render: (c) => ALCANCE[c.appliesTo] ?? c.appliesTo },
    { label: 'Usos', render: (c) => <span className="tabular-nums">{c.usos}{c.maxUses ? ` / ${c.maxUses}` : ''}{c.descuentoTotal ? <span className="block text-[11px] text-neutral-500">−Q{Number(c.descuentoTotal).toFixed(2)}</span> : null}</span> },
    { label: 'Vigencia', render: (c) => (c.validFrom || c.validTo ? `${fecha(c.validFrom)} → ${fecha(c.validTo)}` : 'Siempre') },
    { label: 'Estado', render: (c) => (c.status ? 'Activo' : 'Inactivo') },
  ],
  campos: [
    { name: 'code', label: 'Código (letras y números, sin espacios)', required: true },
    { name: 'description', label: 'Descripción interna' },
    { name: 'type', label: 'Tipo de descuento', type: 'select', required: true, cargar: async () => OPC_TIPO },
    { name: 'value', label: 'Valor (% o Q según el tipo)', type: 'number', required: true },
    { name: 'appliesTo', label: 'Aplica a', type: 'select', required: true, cargar: async () => OPC_ALCANCE },
    { name: 'minAmount', label: 'Compra mínima (Q, opcional)', type: 'number' },
    { name: 'maxUses', label: 'Usos totales máximos (vacío = ilimitado)', type: 'number' },
    { name: 'perUserLimit', label: 'Usos por persona (vacío = ilimitado)', type: 'number' },
    { name: 'validFrom', label: 'Vigente desde (opcional)', type: 'datetime-local' },
    { name: 'validTo', label: 'Vigente hasta (opcional)', type: 'datetime-local' },
    { name: 'status', label: 'Activo', type: 'checkbox' },
  ],
  vacio: () => ({ status: true, type: 'percent', appliesTo: 'all', perUserLimit: 1 }),
  aFormulario: (c) => ({ ...c, validFrom: aLocal(c.validFrom), validTo: aLocal(c.validTo), minAmount: Number(c.minAmount) || '', maxUses: c.maxUses ?? '', perUserLimit: c.perUserLimit ?? '' }),
  aPayload: (f) => ({
    code: String(f.code).trim(), description: f.description || '', type: f.type, value: Number(f.value), appliesTo: f.appliesTo,
    minAmount: Number(f.minAmount) || 0, maxUses: vacioNull(f.maxUses), perUserLimit: vacioNull(f.perUserLimit),
    validFrom: f.validFrom ? new Date(f.validFrom).toISOString() : null, validTo: f.validTo ? new Date(f.validTo).toISOString() : null, status: !!f.status,
  }),
  crear: (p) => api('/cupones/create/', { method: 'POST', body: json(p) }),
  actualizar: (id, p) => api(`/cupones/update/${id}`, { method: 'PUT', body: json(p) }),
  eliminar: (id) => api(`/cupones/delete/${id}`, { method: 'DELETE' }),
};

export default function Page() {
  return (
    <div className="space-y-4">
      <CrudTable cfg={cfg} />
      <p className="text-xs text-neutral-500">Los cupones no se combinan con promociones ni combos. Un cupón ya usado se desactiva en lugar de borrarse, para conservar el historial de reportes. El total nunca baja de Q1.</p>
    </div>
  );
}
