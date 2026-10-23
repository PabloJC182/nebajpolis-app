'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true); setError('');
    try { await api('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }); setEnviado(true); }
    catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-sm bg-[#121318]/90 border border-neutral-800 rounded-xl p-6 space-y-4">
        {enviado ? (
          <div className="text-center space-y-3">
            <MailCheck className="mx-auto text-purple-400" size={40} />
            <h1 className="text-xl font-black">Revisa tu correo</h1>
            <p className="text-sm text-gray-400">Si <strong className="text-white">{email}</strong> tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Vence en 1 hora.</p>
            <Link href="/login" className="inline-block text-sm text-purple-300 hover:text-white font-semibold">Volver a ingresar</Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            <h1 className="text-xl font-black">Recuperar contraseña</h1>
            <p className="text-sm text-gray-400">Escribe tu correo y te enviaremos un enlace para restablecerla.</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
              className="w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button disabled={cargando} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm tracking-wider disabled:opacity-50">
              {cargando ? 'Enviando...' : 'ENVIAR ENLACE'}
            </button>
            <Link href="/login" className="block text-center text-xs text-gray-400 hover:text-white">Volver</Link>
          </form>
        )}
      </div>
    </main>
  );
}
