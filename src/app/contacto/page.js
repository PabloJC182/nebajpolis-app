'use client';

import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const campo = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-purple-500 placeholder-neutral-500';
const lbl = 'block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5';

export default function ContactoPage() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [estado, setEstado] = useState('idle'); // idle | enviando | ok
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('enviando'); setError('');
    try {
      await api('/contact', { method: 'POST', body: JSON.stringify(f) });
      setEstado('ok');
    } catch (err) { setError(err.message); setEstado('idle'); }
  };

  return (
    <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">CONTÁCTENOS</h1>
      <p className="text-sm text-gray-400 mb-8">¿Dudas sobre una compra, una función o un reembolso? Escríbenos y te respondemos por correo.</p>

      {estado === 'ok' ? (
        <div className="bg-[#121318] border border-emerald-500/40 rounded-xl p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
          <h2 className="text-xl font-black">¡Mensaje enviado!</h2>
          <p className="text-sm text-gray-400">Gracias por escribirnos. Te responderemos al correo que indicaste.</p>
        </div>
      ) : (
        <form onSubmit={enviar} className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5 sm:p-7 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl} htmlFor="c-name">Nombre</label><input id="c-name" className={campo} value={f.name} onChange={set('name')} required minLength={2} maxLength={100} autoComplete="name" /></div>
            <div><label className={lbl} htmlFor="c-email">Correo</label><input id="c-email" type="email" className={campo} value={f.email} onChange={set('email')} required autoComplete="email" /></div>
          </div>
          <div><label className={lbl} htmlFor="c-subject">Asunto (opcional)</label><input id="c-subject" className={campo} value={f.subject} onChange={set('subject')} maxLength={120} /></div>
          <div><label className={lbl} htmlFor="c-msg">Mensaje</label><textarea id="c-msg" rows={6} className={campo} value={f.message} onChange={set('message')} required minLength={10} maxLength={2000} /></div>
          {/* Campo trampa anti-bots: oculto para personas */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} className="absolute -left-[9999px] opacity-0 h-0 w-0" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={estado === 'enviando'} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-sm font-bold uppercase tracking-wider disabled:opacity-50">
            <Send size={16} /> {estado === 'enviando' ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      )}
    </main>
  );
}
