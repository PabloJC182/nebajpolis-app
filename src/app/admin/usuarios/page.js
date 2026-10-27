'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { ETIQUETAS, ROLES, leerUsuario } from '@/lib/roles';

const campo = 'bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500';
const INSIGNIA = {
  admin: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
  taquilla: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  analista: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  customer: 'text-neutral-400 border-neutral-700 bg-neutral-800/40',
};
const DESCRIPCION = {
  admin: 'Acceso total',
  taquilla: 'Vende en caja, valida QR y ve su corte',
  analista: 'Solo reportes y exportes, sin datos personales',
  customer: 'Compra y ve sus boletos',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState('');
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [yo, setYo] = useState(null);
  useEffect(() => setYo(leerUsuario()?.id ?? null), []);

  const cargar = useCallback(() => {
    setCargando(true);
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (rol) p.set('role', rol);
    api(`/users?${p}`).then((r) => { setUsuarios(r); setError(''); }).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [q, rol]);
  useEffect(() => { const t = setTimeout(cargar, 250); return () => clearTimeout(t); }, [cargar]);

  const cambiar = async (u, nuevo) => {
    if (nuevo === u.role) return;
    if (!window.confirm(`¿Cambiar a ${u.fullName || u.email} de "${ETIQUETAS[u.role]}" a "${ETIQUETAS[nuevo]}"?\n${DESCRIPCION[nuevo]}.`)) return;
    setError(''); setAviso('');
    try {
      await api(`/users/${u.id}/role`, { method: 'PUT', body: JSON.stringify({ role: nuevo }) });
      setAviso(`${u.fullName || u.email} ahora es ${ETIQUETAS[nuevo]}.`);
      cargar();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Usuarios y roles</h1>
        <p className="text-sm text-gray-400 mt-1">La persona debe registrarse primero en el sitio; luego le asignas su rol aquí. El cambio aplica de inmediato.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
        {ROLES.map((r) => (
          <div key={r} className="bg-[#121318] border border-neutral-800/80 rounded-lg px-3 py-2">
            <span className={`inline-block px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${INSIGNIA[r]}`}>{ETIQUETAS[r]}</span>
            <p className="text-neutral-400 mt-1.5">{DESCRIPCION[r]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input aria-label="Buscar usuario" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo" className={`${campo} w-full pl-9`} />
        </div>
        <select aria-label="Filtrar por rol" value={rol} onChange={(e) => setRol(e.target.value)} className={campo}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ETIQUETAS[r]}</option>)}
        </select>
      </div>

      {aviso && <p className="text-sm text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">{aviso}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="bg-[#121318] border border-neutral-800/80 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Registro</th><th className="px-4 py-3">Rol</th>
          </tr></thead>
          <tbody>
            {cargando && usuarios.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              : usuarios.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Sin resultados.</td></tr>
              : usuarios.map((u) => (
                <tr key={u.id} className="border-b border-neutral-800/60 last:border-0">
                  <td className="px-4 py-3 font-semibold">{u.fullName || '—'}{u.id === yo && <span className="ml-2 text-[10px] text-purple-300">(tú)</span>}</td>
                  <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                  <td className="px-4 py-3 text-neutral-400">{new Date(u.createdAt).toLocaleDateString('es-GT', { dateStyle: 'medium' })}</td>
                  <td className="px-4 py-3">
                    <select aria-label={`Rol de ${u.email}`} value={u.role} disabled={u.id === yo} onChange={(e) => cambiar(u, e.target.value)}
                      title={u.id === yo ? 'No puedes cambiar tu propio rol' : ''}
                      className={`${campo} !py-1.5 border ${INSIGNIA[u.role] ?? ''} disabled:opacity-60`}>
                      {ROLES.map((r) => <option key={r} value={r}>{ETIQUETAS[r]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-neutral-500">Se muestran hasta 200 usuarios; usa el buscador para encontrar a alguien.</p>
    </div>
  );
}
