// Impresión directa en impresoras térmicas ESC/POS (Rongta RP328, etc.) por USB desde Chrome/Edge (WebUSB).
// No usa el driver ni el Spooler de Windows: el dispositivo USB debe tener el driver WinUSB (ver README, "Zadig").
const TZ = 'America/Guatemala';
const KEY = 'usbImpresora';
const COLS = 48; // 80 mm, fuente A

export const usbSoportado = () => typeof navigator !== 'undefined' && !!navigator.usb;
const leerGuardado = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };

// ---------- Texto -> bytes (página de códigos CP858: acentos y ñ del español) ----------
const CP858 = { á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3, ñ: 0xa4, Ñ: 0xa5, '¿': 0xa8, '¡': 0xad, ü: 0x81, Ü: 0x9a, Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9, '·': 0xfa };
const SUST = { '×': 'x', '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...' };
export function aBytes(texto) {
  const out = [];
  for (const ch of String(texto ?? '')) {
    const c = ch.codePointAt(0);
    if (c >= 0x20 && c < 0x7f) out.push(c);
    else if (CP858[ch] !== undefined) out.push(CP858[ch]);
    else if (SUST[ch]) out.push(...[...SUST[ch]].map((x) => x.charCodeAt(0)));
    else {
      const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
      out.push(base.length === 1 && base.charCodeAt(0) >= 0x20 && base.charCodeAt(0) < 0x7f ? base.charCodeAt(0) : 0x3f);
    }
  }
  return out;
}

// ---------- Constructor de comandos ----------
class Cmd {
  constructor() { this.b = []; }
  raw(...x) { this.b.push(...x); return this; }
  init() { return this.raw(0x1b, 0x40, 0x1b, 0x74, 19); }        // reset + CP858
  align(n) { return this.raw(0x1b, 0x61, n); }                   // 0 izq, 1 centro, 2 der
  bold(on) { return this.raw(0x1b, 0x45, on ? 1 : 0); }
  size(n) { return this.raw(0x1d, 0x21, n); }                     // 0x00 normal, 0x11 doble ancho y alto, 0x01 doble alto
  small(on) { return this.raw(0x1b, 0x4d, on ? 1 : 0); }          // fuente B
  feed(n = 1) { return this.raw(0x1b, 0x64, n); }
  text(s) { this.b.push(...aBytes(s)); return this; }
  line(s = '') { return this.text(s).raw(0x0a); }
  dash() { return this.line('-'.repeat(COLS)); }
  qr(data, modulo = 8) {
    const d = aBytes(data);
    const len = d.length + 3;
    return this
      .raw(0x1d, 0x28, 0x6b, 4, 0, 49, 65, 50, 0)                // modelo 2
      .raw(0x1d, 0x28, 0x6b, 3, 0, 49, 67, modulo)                // tamaño del módulo
      .raw(0x1d, 0x28, 0x6b, 3, 0, 49, 69, 49)                    // corrección M
      .raw(0x1d, 0x28, 0x6b, len & 0xff, len >> 8, 49, 80, 48, ...d) // guardar datos
      .raw(0x1d, 0x28, 0x6b, 3, 0, 49, 81, 48);                   // imprimir
  }
  cut() { return this.feed(3).raw(0x1d, 0x56, 0x42, 0x00); }      // corte parcial
  bytes() { return new Uint8Array(this.b); }
}

function envolver(texto, ancho) {
  const lineas = []; let actual = '';
  for (const p of String(texto ?? '').split(/\s+/).filter(Boolean)) {
    if ((actual + ' ' + p).trim().length > ancho) { if (actual) lineas.push(actual); actual = p.slice(0, ancho); } else actual = (actual + ' ' + p).trim();
  }
  if (actual) lineas.push(actual);
  return lineas;
}
const Q = (n) => `Q${Number(n).toFixed(2)}`;
const fecha = (d, o) => new Date(d).toLocaleDateString('es-GT', { timeZone: TZ, ...o });
const hora = (d) => new Date(d).toLocaleTimeString('es-GT', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dosCols = (izq, der) => { const e = Math.max(1, COLS - izq.length - der.length); return izq + ' '.repeat(e) + der; };
const cineDe = (v) => v.pickupCinema?.name ?? v.tickets?.[0]?.show?.room?.cinema?.name ?? '';

function encabezado(c, venta, titulo) {
  c.align(1).bold(true).size(0x11).line('NEBAJPOLIS').size(0).bold(false).line(cineDe(venta)).feed(1)
    .bold(true).size(0x11).line(`[ ${titulo} ]`).size(0).bold(false).feed(1);
}

function ticketEntrada(c, venta, t) {
  const s = t.show;
  encabezado(c, { ...venta, pickupCinema: null, tickets: [t] }, 'ENTRADA');
  c.bold(true).size(0x01);
  for (const l of envolver(s.movie?.title, COLS)) c.line(l);
  c.size(0).bold(false)
    .line(fecha(s.showDatetime, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    .bold(true).text(hora(s.showDatetime)).bold(false).line(` · ${s.room?.name ?? ''}${s.format ? ' · ' + s.format : ''}`)
    .dash().bold(true).size(0x11).line(`FILA ${t.seat?.rowLabel}  ASIENTO ${t.seat?.seatNumber}`).size(0).bold(false).dash()
    .feed(1).qr(t.code ?? `NEBAJPOLIS|V${venta.id}|T${t.id}`).feed(1)
    .small(true).line(t.code ?? '').small(false)
    .line(`Compra #${venta.id} · ${Q(t.price)}`).line('Presenta este QR en la entrada de la sala.').line('Un solo uso.').cut();
}

function ticketComida(c, venta) {
  encabezado(c, venta, 'COMIDA');
  c.align(0);
  for (const l of venta.saleFoodItems ?? []) c.bold(true).line(`${l.quantity} x ${l.foodItem?.name ?? ''}`.slice(0, COLS)).bold(false);
  c.align(1).feed(1).qr(venta.pickupCode).feed(1).small(true).line(venta.pickupCode).small(false);
  if (venta.foodValidUntil) c.bold(true).line(`Valido hasta el ${fecha(venta.foodValidUntil, { day: 'numeric', month: 'long', year: 'numeric' })}`).bold(false);
  c.line('Canjealo en la dulceria aunque no asistas').line('a la funcion.').line(`Pedido #${venta.id}. Un solo uso.`).cut();
}

function recibo(c, venta) {
  encabezado(c, venta, 'RECIBO');
  c.align(0).line(`Compra #${venta.id}  ${fecha(venta.saleDate, { day: 'numeric', month: 'short', year: 'numeric' })} ${hora(venta.saleDate)}`).dash();
  const boletos = (venta.tickets ?? []).reduce((s, t) => s + Number(t.price), 0);
  if ((venta.tickets ?? []).length) c.line(dosCols(`Entradas (${venta.tickets.length})`, Q(boletos)));
  for (const l of venta.saleFoodItems ?? []) c.line(dosCols(`${l.quantity} x ${l.foodItem?.name ?? ''}`.slice(0, COLS - 10), Q(l.quantity * l.unitPrice)));
  c.dash().bold(true).size(0x01).line(dosCols('TOTAL', Q(venta.totalAmount))).size(0).bold(false).align(1).feed(1).line('Gracias por tu compra!').cut();
}

// Bytes ESC/POS de todos los tickets de una venta (exportado para pruebas)
export function construirTickets(venta, { recibo: conRecibo = false } = {}) {
  const c = new Cmd().init();
  let n = 0;
  for (const t of venta.tickets ?? []) { ticketEntrada(c, venta, t); n++; }
  if (venta.pickupCode) { ticketComida(c, venta); n++; }
  if (n === 0) throw new Error('Esta venta no tiene tickets para imprimir.');
  if (conRecibo) recibo(c, venta);
  return { bytes: c.bytes(), tickets: n };
}

export function construirPrueba() {
  const c = new Cmd().init().align(1).bold(true).size(0x11).line('NEBAJPOLIS').size(0).bold(false)
    .line('Prueba de impresora').line('Acentos: áéíóú ñ Ñ ¿? ¡! ü').feed(1)
    .qr('NEBAJPOLIS|PRUEBA').feed(1).line('Si lees esto y el QR, todo funciona.').cut();
  return c.bytes();
}

// ---------- USB ----------
export async function obtenerImpresora({ elegir = false, todos = false } = {}) {
  if (!usbSoportado()) throw new Error('Este navegador no permite USB directo. Usa Chrome o Edge (en https o localhost).');
  const guardado = leerGuardado();
  if (!elegir) {
    const lista = await navigator.usb.getDevices();
    const d = lista.find((x) => guardado && x.vendorId === guardado.vendorId && x.productId === guardado.productId) ?? (lista.length === 1 ? lista[0] : null);
    if (d) return d;
  }
  let d;
  try { d = await navigator.usb.requestDevice({ filters: todos ? [] : [{ classCode: 7 }] }); }
  catch (e) { throw new Error(e.name === 'NotFoundError' ? 'No se eligió ninguna impresora. Si no aparece en la lista, usa "Mostrar todos los dispositivos USB".' : e.message); }
  try { localStorage.setItem(KEY, JSON.stringify({ vendorId: d.vendorId, productId: d.productId })); } catch {}
  return d;
}

export const olvidarImpresora = () => { try { localStorage.removeItem(KEY); } catch {} };

async function enviar(dispositivo, datos) {
  let reclamada = null;
  try {
    if (!dispositivo.opened) await dispositivo.open();
    if (dispositivo.configuration === null) await dispositivo.selectConfiguration(1);
    let elegida = null;
    for (const i of dispositivo.configuration.interfaces) {
      for (const a of i.alternates) {
        const ep = a.endpoints.find((e) => e.direction === 'out' && e.type === 'bulk');
        if (ep && (!elegida || a.interfaceClass === 7)) elegida = { i, a, ep };
      }
    }
    if (!elegida) throw new Error('No se encontró la salida de datos de la impresora.');
    await dispositivo.claimInterface(elegida.i.interfaceNumber);
    reclamada = elegida.i.interfaceNumber;
    if (elegida.a.alternateSetting) await dispositivo.selectAlternateInterface(reclamada, elegida.a.alternateSetting);
    const TAM = 4096;
    for (let o = 0; o < datos.length; o += TAM) await dispositivo.transferOut(elegida.ep.endpointNumber, datos.slice(o, o + TAM));
  } catch (e) {
    if (/claim|access denied|denied|busy/i.test(`${e.name} ${e.message}`)) {
      throw new Error('Windows está usando la impresora con su propio driver. Cambia el driver del dispositivo USB a WinUSB con Zadig (ver README) y vuelve a intentar.');
    }
    throw e;
  } finally {
    try { if (reclamada !== null) await dispositivo.releaseInterface(reclamada); } catch {}
    try { await dispositivo.close(); } catch {}
  }
}

export async function imprimirVentaUSB(venta, { recibo = false } = {}) {
  if (venta.status && venta.status !== 'paid') throw new Error('Solo se pueden imprimir ventas pagadas.');
  const { bytes, tickets } = construirTickets(venta, { recibo });
  await enviar(await obtenerImpresora(), bytes);
  return tickets;
}

export async function imprimirPruebaUSB() {
  await enviar(await obtenerImpresora(), construirPrueba());
}
