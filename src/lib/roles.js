// Roles del sistema (el back es quien realmente los aplica; esto solo decide qué mostrar)
export const ETIQUETAS = { customer: 'Cliente', taquilla: 'Taquilla', analista: 'Analista de datos', admin: 'Administrador' };
export const ROLES = ['customer', 'taquilla', 'analista', 'admin'];

export const esPersonal = (rol) => ['admin', 'taquilla', 'analista'].includes(rol);

// Páginas del panel que ve cada rol (admin: todas)
const PERMISOS = {
  taquilla: ['/admin/taquilla', '/admin/validar', '/admin/corte'],
  analista: ['/admin', '/admin/reportes'],
};

export const puedeVer = (rol, ruta) => {
  if (rol === 'admin') return true;
  return (PERMISOS[rol] ?? []).some((p) => (p === '/admin' ? ruta === '/admin' : ruta === p || ruta.startsWith(`${p}/`)));
};

export const inicioPara = (rol) => (rol === 'admin' ? '/admin' : rol === 'analista' ? '/admin/reportes' : rol === 'taquilla' ? '/admin/taquilla' : '/');

export const leerUsuario = () => { try { return JSON.parse(localStorage.getItem('usuario') || 'null'); } catch { return null; } };
export const guardarRol = (rol) => {
  try { const u = leerUsuario(); if (u && u.role !== rol) localStorage.setItem('usuario', JSON.stringify({ ...u, role: rol })); } catch {}
};
