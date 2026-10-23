'use client';

import CrudTable from '@/components/admin/CrudTable';
import { api } from '@/lib/api';
import { obtenerVenta } from '@/lib/booking';
import { imprimirVenta, prepararImpresora, leerReciboPref } from '@/lib/imprimir';

const ESTADO = { paid: 'Pagada', pending: 'Pendiente', expired: 'Vencida', cancelled: 'Cancelada', refunded: 'Reembolsada' };
const cfg = {
  titulo: 'Ventas',
  listar: async () => { const r = await api('/sales'); return Array.isArray(r) ? r : []; },
  columnas: [
    { label: '#', render: (v) => v.id },
    { label: 'Cliente', render: (v) => v.appUser?.fullName ?? v.appUser?.email ?? (v.guestEmail ? `${v.channel === 'box_office' ? 'Cliente' : 'Invitado'} · ${v.guestEmail}` : v.guestName ?? (v.channel === 'box_office' ? 'Mostrador' : `Usuario ${v.userId}`)) },
    { label: 'Fecha', render: (v) => new Date(v.saleDate).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) },
    { label: 'Boletos', render: (v) => v.tickets?.length ?? 0 },
    { label: 'Comida', render: (v) => (v.saleFoodItems ?? []).map((l) => `${l.quantity}× ${l.foodItem?.name}`).join(', ') || '—' },
    { label: 'Total', render: (v) => <span className="font-bold">Q{Number(v.totalAmount).toFixed(2)}</span> },
    { label: 'Tipo', render: (v) => (v.kind === 'food' ? 'Dulcería' : 'Boletos') },
    { label: 'Canal', render: (v) => (v.channel === 'box_office' ? 'Taquilla' : 'Web') },
    { label: 'Estado', render: (v) => ESTADO[v.status] ?? v.status },
  ],
  acciones: [
    {
      label: 'Imprimir',
      mostrar: (v) => v.status === 'paid',
      onClick: async (v, { error }) => {
        error('');
        try { await prepararImpresora(); await imprimirVenta(await obtenerVenta(v.id), { recibo: leerReciboPref() }); }
        catch (e) { error(e.message); }
      },
    },
    {
      label: 'Reembolsar',
      mostrar: (v) => v.status === 'paid',
      onClick: async (v, { recargar, avisar, error }) => {
        const motivo = window.prompt(`Reembolsar la venta #${v.id} por Q${Number(v.totalAmount).toFixed(2)}.\nSe libera(n) el/los asiento(s)${v.channel === 'box_office' ? '' : ' y se devuelve el dinero en Stripe'}.\n\nMotivo (opcional):`);
        if (motivo === null) return;
        avisar(''); error('');
        try {
          const r = await api(`/sales/${v.id}/reembolsar`, { method: 'POST', body: JSON.stringify({ reason: motivo }) });
          avisar(r.message);
          recargar();
        } catch (e) { error(e.message); }
      },
    },
  ],
  campos: [],
};

export default function Page() { return <CrudTable cfg={cfg} />; }
