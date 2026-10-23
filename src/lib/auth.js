import { api } from '@/lib/api';
import { EP } from '@/lib/endpoints';

export async function iniciarSesion(email, password) {
  const r = await api(EP.signin, { method: 'POST', body: JSON.stringify({ email, password }) });
  localStorage.setItem('token', r.accessToken);
  localStorage.setItem('usuario', JSON.stringify({ id: r.id, fullName: r.fullName, role: r.role }));
  return r;
}

export const registrarse = (datos) => api(EP.signup, { method: 'POST', body: JSON.stringify(datos) });

export const cerrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};
