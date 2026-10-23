'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RestablecerPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') ?? ''); }, []);

  const enviar = async (e) => {
    e.preventDefault();
    if (password !== repetir) return setError('Las contraseñas no coinciden.');
    setCargando(true); setError('');
    try {
      await api('/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
      setListo(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500';
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm bg-[#121318]/90 border border-neutral-800 rounded-xl p-6 space-y-4">
        {listo ? (
          <div className="text-center space-y-2">
            <h1 className="text-xl font-black">¡Contraseña actualizada!</h1>
            <p className="text-sm text-gray-400">Te llevamos al inicio de sesión...</p>
          </div>
        ) : !token ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-red-400">El enlace no es válido.</p>
            <Link href="/recuperar" className="text-sm text-purple-300 hover:text-white font-semibold">Solicitar uno nuevo</Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <h1 className="text-xl font-black">Nueva contraseña</h1>
            <input className={campo} type="password" required minLength={8} placeholder="Nueva contraseña (mínimo 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className={campo} type="password" required minLength={8} placeholder="Repite la contraseña" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={cargando} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm tracking-wider disabled:opacity-50">
              {cargando ? 'Guardando...' : 'GUARDAR CONTRASEÑA'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
