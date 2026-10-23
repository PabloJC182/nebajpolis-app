'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Armchair, Film } from 'lucide-react';
import { obtenerCines, obtenerSalasPorCine, guardarCine } from '@/lib/cine';

export default function CinesPage() {
  const router = useRouter();
  const [cines, setCines] = useState([]);
  const [salas, setSalas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerCines(), obtenerSalasPorCine()])
      .then(([c, s]) => { setCines(c); setSalas(s); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const ciudades = useMemo(() => {
    const m = new Map();
    cines.forEach((c) => (m.get(c.city) ?? m.set(c.city, []).get(c.city)).push(c));
    return [...m.entries()];
  }, [cines]);

  const verCartelera = (id) => { guardarCine(id); router.push('/cartelera'); };

  return (
    <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">NUESTROS CINES</h1>
      <p className="text-sm text-gray-400 mb-8">Encuentra tu sala, sus formatos y cómo llegar</p>

      {cargando ? <p className="text-center text-gray-400 py-20">Cargando...</p>
        : error ? <p className="text-center text-red-400 py-20">{error}</p>
        : cines.length === 0 ? <p className="text-center text-gray-400 py-20">Aún no hay cines registrados.</p>
        : ciudades.map(([ciudad, lista]) => (
          <section key={ciudad} className="mb-10">
            <h2 className="text-xs uppercase tracking-widest text-purple-300 font-bold mb-4">{ciudad}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {lista.map((c) => {
                const s = salas[c.id] ?? [];
                const asientos = s.reduce((t, r) => t + r.seats, 0);
                return (
                  <article key={c.id} className="bg-[#121318] border border-neutral-800/80 rounded-xl p-5 flex flex-col gap-4">
                    <div>
                      <h3 className="text-lg font-black">{c.name}</h3>
                      {c.address && <p className="flex items-start gap-2 text-sm text-gray-400 mt-2"><MapPin size={14} className="text-purple-400 mt-0.5 flex-shrink-0" />{c.address}</p>}
                      {c.phone && <p className="flex items-center gap-2 text-sm text-gray-400 mt-1"><Phone size={14} className="text-purple-400" /><a href={`tel:${c.phone}`} className="hover:text-white">{c.phone}</a></p>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60"><Film size={12} className="text-purple-400" />{s.length} sala{s.length === 1 ? '' : 's'}</span>
                      {asientos > 0 && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60"><Armchair size={12} className="text-purple-400" />{asientos} asientos</span>}
                      {[...new Set(s.map((r) => r.type))].map((t) => <span key={t} className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-200 font-bold">{t}</span>)}
                    </div>
                    <div className="flex items-center gap-4 mt-auto pt-1">
                      <button onClick={() => verCartelera(c.id)} className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">Ver cartelera</button>
                      {(c.address || c.name) && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.name, c.address, c.city].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-wider text-purple-300 hover:text-white">Cómo llegar</a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      <p className="text-center text-xs text-gray-500">¿Dudas? <Link href="/contacto" className="text-purple-300 hover:text-white underline">Escríbenos</Link></p>
    </main>
  );
}
