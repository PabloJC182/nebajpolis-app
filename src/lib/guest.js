// Compras como invitado: el back entrega un token por venta; se guarda en este navegador.
const KEY = 'guestSales';
const leer = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

export const guardarTokenInvitado = (saleId, token) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...leer(), [saleId]: token })); } catch {}
};
export const tokenInvitado = (saleId) => (typeof window === 'undefined' ? null : leer()[saleId] ?? null);
export const hayCuenta = () => typeof window !== 'undefined' && !!localStorage.getItem('token');
