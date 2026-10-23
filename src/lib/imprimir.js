import QRCode from 'qrcode';

// Impresión de tickets en impresora térmica de 80 mm (p. ej. Rongta RP328) vía el diálogo de impresión del navegador.
// Un ticket por entrada (cada una con su QR), un ticket aparte para la comida y, opcional, un recibo resumen.
const TZ = 'America/Guatemala';
const KEY = 'imprimirRecibo';

export const leerReciboPref = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const guardarReciboPref = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {} };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Q = (n) => `Q${Number(n).toFixed(2)}`;
const fecha = (d, o) => new Date(d).toLocaleDateString('es-GT', { timeZone: TZ, ...o });
const hora = (d) => new Date(d).toLocaleTimeString('es-GT', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const qr = (texto) => QRCode.toDataURL(texto, { width: 400, margin: 1, errorCorrectionLevel: 'M' });

const CSS = `
@page { size: 80mm auto; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { width: 80mm; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.25; }
.t { width: 72mm; margin: 0 auto; padding: 4mm 0 6mm; text-align: center; page-break-after: always; break-after: page; }
.t:last-child { page-break-after: auto; break-after: auto; }
.marca { font-size: 18px; font-weight: 900; letter-spacing: 2px; }
.cine { font-size: 11px; margin-top: 1mm; }
.tipo { display: inline-block; margin: 3mm 0 2mm; padding: 1mm 4mm; border: 2px solid #000; font-weight: 900; letter-spacing: 2px; font-size: 13px; }
.peli { font-size: 17px; font-weight: 900; margin: 1mm 0; word-break: break-word; }
.dato { font-size: 12px; margin: .6mm 0; }
.asiento { font-size: 22px; font-weight: 900; margin: 2.5mm 0 2mm; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2mm 0; }
.qr { width: 44mm; height: 44mm; display: block; margin: 2mm auto 1mm; image-rendering: pixelated; }
.cod { font-size: 8px; font-family: 'Courier New', monospace; word-break: break-all; }
.nota { font-size: 10px; margin-top: 2mm; }
.fila { display: flex; justify-content: space-between; text-align: left; font-size: 12px; margin: .8mm 0; gap: 3mm; }
.tot { font-size: 15px; font-weight: 900; border-top: 1px dashed #000; margin-top: 2mm; padding-top: 2mm; }
hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
`;

function cineDe(venta) {
  return venta.pickupCinema?.name ?? venta.tickets?.[0]?.show?.room?.cinema?.name ?? '';
}

async function ticketEntrada(venta, t) {
  const img = await qr(t.code ?? `NEBAJPOLIS|V${venta.id}|T${t.id}`);
  const s = t.show;
  return `<section class="t">
    <div class="marca">NEBAJPOLIS</div><div class="cine">${esc(s.room?.cinema?.name)}</div>
    <div class="tipo">ENTRADA</div>
    <div class="peli">${esc(s.movie?.title)}</div>
    <div class="dato">${esc(fecha(s.showDatetime, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>
    <div class="dato"><b>${esc(hora(s.showDatetime))}</b> · ${esc(s.room?.name)}${s.format ? ' · ' + esc(s.format) : ''}</div>
    <div class="asiento">FILA ${esc(t.seat?.rowLabel)} · ASIENTO ${esc(t.seat?.seatNumber)}</div>
    <img class="qr" src="${img}" alt="QR">
    <div class="cod">${esc(t.code ?? '')}</div>
    <div class="nota">Compra #${esc(venta.id)} · ${Q(t.price)}<br>Presenta este QR en la entrada de la sala. Un solo uso.</div>
  </section>`;
}

async function ticketComida(venta) {
  const img = await qr(venta.pickupCode);
  const items = (venta.saleFoodItems ?? []).map((l) => `<div class="fila"><span>${esc(l.quantity)} × ${esc(l.foodItem?.name)}</span></div>`).join('');
  const vence = venta.foodValidUntil ? fecha(venta.foodValidUntil, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return `<section class="t">
    <div class="marca">NEBAJPOLIS</div><div class="cine">${esc(cineDe(venta))}</div>
    <div class="tipo">COMIDA</div>
    <div style="margin:2mm 0">${items}</div>
    <img class="qr" src="${img}" alt="QR comida">
    <div class="cod">${esc(venta.pickupCode)}</div>
    <div class="nota">${vence ? `<b>Válido hasta el ${esc(vence)}</b><br>` : ''}Canjéalo en la dulcería aunque no asistas a la función.<br>Pedido #${esc(venta.id)}. Un solo uso.</div>
  </section>`;
}

function recibo(venta) {
  const boletos = (venta.tickets ?? []).reduce((s, t) => s + Number(t.price), 0);
  const lineas = (venta.saleFoodItems ?? []).map((l) => `<div class="fila"><span>${esc(l.quantity)} × ${esc(l.foodItem?.name)}</span><span>${Q(l.quantity * l.unitPrice)}</span></div>`).join('');
  return `<section class="t">
    <div class="marca">NEBAJPOLIS</div><div class="cine">${esc(cineDe(venta))}</div>
    <div class="tipo">RECIBO</div>
    <div class="dato">Compra #${esc(venta.id)} · ${esc(fecha(venta.saleDate, { day: 'numeric', month: 'short', year: 'numeric' }))} ${esc(hora(venta.saleDate))}</div><hr>
    ${(venta.tickets ?? []).length ? `<div class="fila"><span>Entradas (${venta.tickets.length})</span><span>${Q(boletos)}</span></div>` : ''}
    ${lineas}
    <div class="fila tot"><span>TOTAL</span><span>${Q(venta.totalAmount)}</span></div>
    <div class="nota">¡Gracias por tu compra!</div>
  </section>`;
}

// Imprime los tickets de una venta pagada. Devuelve la cantidad de tickets impresos.
export async function imprimirVenta(venta, { recibo: conRecibo = false } = {}) {
  if (venta.status && venta.status !== 'paid') throw new Error('Solo se pueden imprimir ventas pagadas.');
  const partes = [];
  for (const t of venta.tickets ?? []) partes.push(await ticketEntrada(venta, t));
  if (venta.pickupCode) partes.push(await ticketComida(venta));
  if (partes.length === 0) throw new Error('Esta venta no tiene tickets para imprimir.');
  if (conRecibo) partes.push(recibo(venta));

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Tickets compra #${esc(venta.id)}</title><style>${CSS}</style></head><body>${partes.join('')}</body></html>`;
  await new Promise((resolve, reject) => {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    f.onload = () => {
      const w = f.contentWindow;
      const imgs = [...w.document.images];
      Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => {
        try { w.focus(); w.print(); resolve(); } catch (e) { reject(e); }
        setTimeout(() => f.remove(), 60000);
      });
    };
    f.srcdoc = html;
    document.body.appendChild(f);
  });
  return partes.length - (conRecibo ? 1 : 0);
}
