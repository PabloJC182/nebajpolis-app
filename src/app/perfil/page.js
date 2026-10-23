'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500';
const lbl = 'block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5';

export default function PerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState({ fullName: '', phone: '' });
  const [msgDatos, setMsgDatos] = useState(null);
  const [clave, setClave] = useState({ currentPassword: '', newPassword: '', repetir: '' });
  const [msgClave, setMsgClave] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) return router.replace('/login?next=/perfil');
    api('/auth/me')
      .then((p) => { setPerfil(p); setDatos({ fullName: p.fullName ?? '', phone: p.phone ?? '' }); })
      .catch((e) => { if (e.status === 401 || e.status === 403) router.replace('/login?next=/perfil'); else setMsgDatos({ ok: false, t: e.message }); });
  }, [router]);

  const guardarDatos = async (e) => {
    e.preventDefault(); setMsgDatos(null);
    try {
      const p = await api('/auth/me', { method: 'PUT', body: JSON.stringify(datos) });
      setPerfil(p);
      try { localStorage.setItem('usuario', JSON.stringify({ id: p.id, fullName: p.fullName, role: p.role })); } catch {}
      setMsgDatos({ ok: true, t: 'Datos actualizados.' });
    } catch (err) { setMsgDatos({ ok: false, t: err.message }); }
  };

  const cambiarClave = async (e) => {
    e.preventDefault(); setMsgClave(null);
    if (clave.newPassword !== clave.repetir) return setMsgClave({ ok: false, t: 'Las contraseñas nuevas no coinciden.' });
    try {
      await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: clave.currentPassword, newPassword: clave.newPassword }) });
      setClave({ currentPassword: '', newPassword: '', repetir: '' });
      setMsgClave({ ok: true, t: 'Contraseña actualizada.' });
    } catch (err) { setMsgClave({ ok: false, t: err.message }); }
  };

  const Msg = ({ m }) => m && <p className={`text-sm ${m.ok ? 'text-emerald-400' : 'text-red-400'}`}>{m.t}</p>;
  if (!perfil) return <p className="relative z-10 pt-40 text-center text-gray-400 min-h-screen">Cargando...</p>;

  return (
    <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center text-2xl font-black">{(perfil.fullName || '?').charAt(0).toUpperCase()}</div>
        <div>
          <h1 className="text-2xl font-black">{perfil.fullName}</h1>
          <p className="text-sm text-gray-400">{perfil.email}{perfil.role === 'admin' && <span className="ml-2 text-[10px] text-purple-300 border border-purple-500/40 rounded px-1.5 py-0.5">ADMIN</span>}</p>
        </div>
      </div>

      <form onSubmit={guardarDatos} className="bg-[#121318]/90 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Mis datos</h2>
        <div><label className={lbl}>Nombre completo</label><input className={campo} required value={datos.fullName} onChange={(e) => setDatos({ ...datos, fullName: e.target.value })} /></div>
        <div><label className={lbl}>Teléfono</label><input className={campo} value={datos.phone} onChange={(e) => setDatos({ ...datos, phone: e.target.value })} /></div>
        <div><label className={lbl}>Correo</label><input className={`${campo} opacity-60`} value={perfil.email} disabled /></div>
        <Msg m={msgDatos} />
        <button className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider">Guardar</button>
      </form>

      <form onSubmit={cambiarClave} className="bg-[#121318]/90 border border-neutral-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Cambiar contraseña</h2>
        <input className={campo} type="password" required placeholder="Contraseña actual" value={clave.currentPassword} onChange={(e) => setClave({ ...clave, currentPassword: e.target.value })} />
        <input className={campo} type="password" required minLength={8} placeholder="Nueva contraseña (mínimo 8 caracteres)" value={clave.newPassword} onChange={(e) => setClave({ ...clave, newPassword: e.target.value })} />
        <input className={campo} type="password" required minLength={8} placeholder="Repite la nueva contraseña" value={clave.repetir} onChange={(e) => setClave({ ...clave, repetir: e.target.value })} />
        <Msg m={msgClave} />
        <button className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider">Actualizar contraseña</button>
      </form>

      <Link href="/mis-boletos" className="inline-block text-sm text-purple-300 hover:text-white font-semibold">Ir a mis boletos →</Link>
    </main>
  );
}
