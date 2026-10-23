'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { obtenerPeliculas, extraerGeneros } from '@/lib/movies';
import { obtenerFuncionesProximas } from '@/lib/booking';
import { diaGT, TZ } from '@/lib/adapters';
import { useCine } from '@/lib/cine';
import SelectorCine from '@/components/SelectorCine';
import MovieCard from '@/components/MovieCard';

const ORDENES = [
  { valor: 'reciente', label: 'Más recientes' },
  { valor: 'titulo', label: 'Título A–Z' },
  { valor: 'duracion', label: 'Duración' },
];

// Convierte "1h 42m" a minutos
const minutos = (d) => Number(/(\d+)h/.exec(d)?.[1] ?? 0) * 60 + Number(/(\d+)m/.exec(d)?.[1] ?? 0);

const etiquetaDia = (key) => {
  const d = new Date(`${key}T12:00:00-06:00`);
  const corto = d.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
  return key === diaGT(new Date()) ? `Hoy · ${d.getDate()}` : key === diaGT(new Date(Date.now() + 864e5)) ? `Mañana · ${d.getDate()}` : corto;
};
const selectCls = 'bg-surface border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-brand-500';

export default function CarteleraClient() {
  const consulta = useSearchParams().get('q') ?? '';
  const [peliculas, setPeliculas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [orden, setOrden] = useState('reciente');
  const [funciones, setFunciones] = useState([]);
  const [formato, setFormato] = useState('');
  const [clasif, setClasif] = useState('');
  const [dia, setDia] = useState('');
  const [cineId] = useCine();

  useEffect(() => {
    obtenerPeliculas()
      .then(setPeliculas)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
    obtenerFuncionesProximas().then(setFunciones).catch(() => {});
  }, []);

  const formatos = useMemo(() => [...new Set(funciones.map((f) => f.format).filter(Boolean))].sort(), [funciones]);
  const clasificaciones = useMemo(() => [...new Set(peliculas.map((m) => m.rating).filter(Boolean))].sort(), [peliculas]);
  const dias = useMemo(() => [...new Set(funciones.map((f) => f.dayKey))].sort().slice(0, 10), [funciones]);

  // Con cine, formato o día elegidos, una película cuenta solo si tiene una función que cumpla TODO a la vez
  const conFuncion = useMemo(() => {
    if (!cineId && !formato && !dia) return null;
    return new Set(funciones
      .filter((f) => (!cineId || f.cinemaId === cineId) && (!formato || f.format === formato) && (!dia || f.dayKey === dia))
      .map((f) => f.movieId));
  }, [funciones, cineId, formato, dia]);

  const generos = useMemo(() => ['Todos', ...extraerGeneros(peliculas)], [peliculas]);

  const visibles = useMemo(() => {
    const q = consulta.trim().toLowerCase();
    const filtradas = peliculas.filter((m) => {
      const okGenero = genero === 'Todos' || m.genres.includes(genero);
      const okClasif = !clasif || m.rating === clasif;
      const okFuncion = !conFuncion || conFuncion.has(m.id);
      const okTexto = !q || m.title.toLowerCase().includes(q) || m.genres.some((g) => g.toLowerCase().includes(q));
      return okGenero && okTexto && okClasif && okFuncion;
    });
    return [...filtradas].sort((a, b) => {
      if (orden === 'titulo') return a.title.localeCompare(b.title);
      if (orden === 'duracion') return minutos(b.duration) - minutos(a.duration);
      return String(b.releaseDate).localeCompare(String(a.releaseDate));
    });
  }, [peliculas, consulta, genero, orden, clasif, conFuncion]);

  const hayFiltros = genero !== 'Todos' || formato || clasif || dia || cineId;
  const limpiar = () => { setGenero('Todos'); setFormato(''); setClasif(''); setDia(''); };

  return (
    <main className="relative z-10 pt-28 pb-20 px-6 md:px-12 min-h-screen">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">CARTELERA</h1>
        {consulta && (
          <p className="flex items-center gap-2 text-gray-400 text-sm">
            <Search className="w-4 h-4 text-brand-400" />
            Resultados para <span className="text-brand-400 font-semibold">"{consulta}"</span>
          </p>
        )}
      </header>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {generos.map((g) => (
            <button
              key={g}
              onClick={() => setGenero(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                genero === g ? 'bg-brand-600 border-brand-500 text-white' : 'border-gray-700 text-gray-400 hover:border-brand-500/60 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <SelectorCine />
        <select value={dia} onChange={(e) => setDia(e.target.value)} className={selectCls} aria-label="Día">
          <option value="">Cualquier día</option>
          {dias.map((d) => <option key={d} value={d}>{etiquetaDia(d)}</option>)}
        </select>
        <select value={formato} onChange={(e) => setFormato(e.target.value)} className={selectCls} aria-label="Formato">
          <option value="">Todos los formatos</option>
          {formatos.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={clasif} onChange={(e) => setClasif(e.target.value)} className={selectCls} aria-label="Clasificación">
          <option value="">Toda clasificación</option>
          {clasificaciones.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          className="bg-surface border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-brand-500"
        >
          {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
        </select>
        </div>
      </div>

      {!cargando && !error && (
        <p className="text-xs text-gray-500 -mt-4 mb-6">
          {visibles.length} película{visibles.length === 1 ? '' : 's'}
          {hayFiltros && <button onClick={limpiar} className="ml-3 text-purple-300 hover:text-white underline">Limpiar filtros</button>}
        </p>
      )}

      {cargando ? (
        <p className="text-center text-gray-400 py-20">Cargando películas...</p>
      ) : error ? (
        <p className="text-center text-red-400 py-20">{error}</p>
      ) : visibles.length === 0 ? (
        <p className="text-center text-gray-400 py-20 text-lg">No encontramos películas con esos criterios.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {visibles.map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </main>
  );
}
