'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { obtenerProximosConPreventa } from '@/lib/movies';
import { TZ } from '@/lib/adapters';

const fechaLarga = (d) => new Date(`${String(d).slice(0, 10)}T12:00:00-06:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const diasFaltan = (d) => Math.max(0, Math.ceil((new Date(`${String(d).slice(0, 10)}T00:00:00-06:00`) - Date.now()) / 864e5));

export default function ProximamentePage() {
  const [peliculas, setPeliculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [soloPreventa, setSoloPreventa] = useState(false);

  useEffect(() => {
    setSoloPreventa(new URLSearchParams(window.location.search).get('tab') === 'preventa');
    obtenerProximosConPreventa().then(setPeliculas).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, []);

  return (
    <main className="relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">PRÓXIMAMENTE</h1>
      <p className="text-sm text-gray-400 mb-6">Los estrenos que llegan a Nebajpolis</p>

      {!cargando && !error && peliculas.some((m) => m.preventa) && (
        <div className="flex gap-2 mb-8">
          {[[false, 'Todos'], [true, 'En preventa']].map(([v, l]) => (
            <button key={l} onClick={() => setSoloPreventa(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${soloPreventa === v ? 'bg-brand-600 border-brand-500 text-white' : 'border-gray-700 text-gray-400 hover:border-brand-500/60 hover:text-white'}`}>{l}</button>
          ))}
        </div>
      )}

      {cargando ? <p className="text-center text-gray-400 py-20">Cargando...</p>
        : error ? <p className="text-center text-red-400 py-20">{error}</p>
        : peliculas.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <CalendarClock className="mx-auto text-purple-400" size={40} />
            <p className="text-gray-400">Aún no hay estrenos anunciados.</p>
            <Link href="/cartelera" className="inline-block px-5 py-2 rounded-full bg-purple-600 text-xs font-bold uppercase tracking-wider">Ver cartelera</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {peliculas.filter((m) => !soloPreventa || m.preventa).map((m) => {
              const n = diasFaltan(m.releaseDate);
              return (
                <Link key={m.id} href={`/pelicula/${m.id}`} className="group bg-[#121318]/90 border border-neutral-800 hover:border-purple-500/50 rounded-xl overflow-hidden transition-colors">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={m.backdrop} alt={m.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121318] via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 text-[11px] font-bold bg-purple-600 px-2.5 py-1 rounded-full">{n <= 1 ? 'Mañana' : `En ${n} días`}</span>
                    {m.preventa && <span className="absolute top-3 left-3 text-[11px] font-black tracking-wider bg-gradient-to-r from-fuchsia-600 to-purple-600 px-2.5 py-1 rounded-full">PREVENTA</span>}
                  </div>
                  <div className="p-4 space-y-2">
                    <h2 className="text-lg font-black truncate">{m.title}</h2>
                    <p className="flex items-center gap-1.5 text-xs text-purple-300"><CalendarClock size={13} />Estreno: {fechaLarga(m.releaseDate)}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{m.synopsis}</p>
                    {m.preventa && <p className="text-xs font-bold text-emerald-400">Boletos a la venta · {m.funcionesCount} función{m.funcionesCount === 1 ? '' : 'es'}</p>}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.genres.slice(0, 3).map((g) => <span key={g} className="text-[10px] text-gray-300 bg-white/10 px-2 py-0.5 rounded">{g}</span>)}
                      {m.trailerId && <span className="text-[10px] text-fuchsia-300 border border-fuchsia-500/40 px-2 py-0.5 rounded">Con tráiler</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </main>
  );
}
