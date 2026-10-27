'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iniciarSesion, registrarse } from '@/lib/auth';
import { inicioPara } from '@/lib/roles';

// Solo rutas internas: evita redirigir a sitios externos con ?next=
const destinoSeguro = (next, rol) => (next && next.startsWith('/') && !next.startsWith('//') ? next : inicioPara(rol));

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState('login');
  const [f, setF] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('modo') === 'registro') setModo('registro'); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      if (modo === 'registro') await registrarse(f);
      const u = await iniciarSesion(f.email, f.password);
      router.push(destinoSeguro(new URLSearchParams(window.location.search).get('next'), u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-500';
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
      <form onSubmit={enviar} className="w-full max-w-sm bg-[#121318]/90 border border-neutral-800 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-black">{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</h1>
        {modo === 'registro' && (
          <>
            <input className={campo} placeholder="Nombre completo" value={f.fullName} onChange={set('fullName')} required />
            <input className={campo} placeholder="Teléfono" value={f.phone} onChange={set('phone')} />
          </>
        )}
        <input className={campo} type="email" placeholder="Correo" value={f.email} onChange={set('email')} required />
        <input className={campo} type="password" placeholder={modo === 'registro' ? 'Contraseña (mínimo 8 caracteres)' : 'Contraseña'} value={f.password} onChange={set('password')} required minLength={modo === 'registro' ? 8 : undefined} />
        {modo === 'login' && <Link href="/recuperar" className="block text-right text-xs text-purple-300 hover:text-white">¿Olvidaste tu contraseña?</Link>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={cargando} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-sm tracking-wider disabled:opacity-50">
          {cargando ? 'Enviando...' : modo === 'login' ? 'INGRESAR' : 'REGISTRARME'}
        </button>
        <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} className="w-full text-xs text-gray-400 hover:text-white">
          {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Ingresa'}
        </button>
      </form>
    </main>
  );
}
