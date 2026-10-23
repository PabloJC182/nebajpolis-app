'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ArrowLeft, Clapperboard, User } from 'lucide-react';
import { obtenerReparto } from '@/lib/movies';

const fechaNac = (d) => (d ? new Date(d).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—');

function Foto({ src, alt, className, iconSize = 48 }) {
  const [falla, setFalla] = useState(false);
  if (!src || falla) {
    return <div className={`${className} flex items-center justify-center bg-neutral-900 text-neutral-600`}><User size={iconSize} /></div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFalla(true)} />;
}

function Miembro({ m, activo, onSelect }) {
  return (
    <div onClick={onSelect}
      className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-300 group ${
        activo ? 'bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-transparent border-l-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
          : 'hover:bg-neutral-900/50 opacity-60 hover:opacity-100 border-l-4 border-transparent'}`}>
      <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800">
        <Foto src={m.photo} alt={m.name} iconSize={20} className={`w-full h-full object-cover ${activo ? '' : 'grayscale group-hover:grayscale-0'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <span className={`block text-xs sm:text-sm font-black tracking-wider uppercase truncate ${activo ? 'text-white' : 'text-neutral-300'}`}>{m.name}</span>
        <span className="block text-[11px] text-neutral-400 truncate">{m.role}</span>
      </div>
      {activo && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)] mr-2 animate-pulse" />}
    </div>
  );
}

function Detalle({ m, titulo, animando }) {
  return (
    <div className={`space-y-6 transition-all duration-300 ${animando ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2.5 py-1 rounded">REPARTO</span>
          <span className="text-xs text-neutral-500 font-mono">/ {m.order}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight leading-none drop-shadow-lg break-words">{m.name}</h1>
        <p className="text-sm sm:text-base text-purple-300 font-medium mt-2">
          <strong className="text-white font-bold">{m.role}</strong> en {titulo}
        </p>
      </div>
      <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full" />
      {m.bio ? (
        <p className="bg-[#121318]/60 p-4 rounded-xl border border-neutral-800/80 backdrop-blur-sm text-xs sm:text-sm leading-relaxed text-neutral-300 font-light max-w-xl">{m.bio}</p>
      ) : (
        <p className="text-xs text-neutral-500 italic">Sin biografía disponible.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl pt-2">
        {[['NOMBRE', m.name, 'text-white'], ['ROL', m.role, 'text-purple-400'], ['NACIMIENTO', fechaNac(m.birthDate), 'text-white']].map(([k, v, c], i) => (
          <div key={k} className={`bg-[#121318]/80 border border-neutral-800/80 rounded-xl p-3 backdrop-blur-sm ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">{k}</span>
            <span className={`text-xs sm:text-sm font-bold truncate block ${c}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Imagen({ m, animando }) {
  return (
    <div className="relative w-full h-[380px] sm:h-[480px] lg:h-[620px] flex items-end justify-center">
      <div className="absolute w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] bg-purple-600/20 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute top-12 right-6 hidden lg:flex flex-col items-end gap-1 text-[10px] font-mono text-neutral-600 select-none pointer-events-none">
        <span>PERSON_ID // {m.id}</span><span>STATUS // ACTIVE</span><div className="w-12 h-[1px] bg-neutral-800 mt-1" />
      </div>
      <Foto src={m.photo} alt={m.name} iconSize={96}
        className={`w-full h-full object-contain object-bottom transition-all duration-500 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] ${animando ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}`} />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none" />
    </div>
  );
}

export default function RepartoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [animando, setAnimando] = useState(false);

  useEffect(() => {
    obtenerReparto(id).then(setData).catch((e) => setError(e.status === 404 ? 'Película no encontrada' : e.message));
  }, [id]);

  const total = data?.cast.length ?? 0;
  const elegir = useCallback((i) => {
    if (i === idx || total === 0) return;
    setAnimando(true);
    setTimeout(() => { setIdx(i); setAnimando(false); }, 250);
  }, [idx, total]);
  const sig = useCallback(() => elegir((idx + 1) % total), [elegir, idx, total]);
  const ant = useCallback(() => elegir((idx - 1 + total) % total), [elegir, idx, total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ant();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') sig();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ant, sig]);

  if (error) return <p className="relative z-10 pt-40 text-center text-red-400 min-h-screen">{error}</p>;
  if (!data) return <p className="relative z-10 pt-40 text-center text-gray-400 min-h-screen">Cargando reparto...</p>;

  const { movie, cast } = data;
  const volver = () => router.push(`/pelicula/${id}`);

  if (cast.length === 0) {
    return (
      <main className="relative z-10 pt-40 text-center space-y-4 min-h-screen px-6">
        <p className="text-gray-400">Esta película aún no tiene reparto registrado.</p>
        <button onClick={volver} className="text-purple-300 hover:text-white text-sm font-bold">Volver a {movie.title}</button>
      </main>
    );
  }

  const m = cast[idx];
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-0 pointer-events-none">
        <img src={movie.backdrop} alt="" className="w-full h-full object-cover blur-[4px] opacity-20 scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-transparent" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4 w-full flex items-center justify-between gap-3">
        <button onClick={volver} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white bg-[#121318]/80 border border-neutral-800/80 px-3 py-2 rounded-xl backdrop-blur-md min-w-0">
          <ArrowLeft size={16} className="text-purple-400 flex-shrink-0" /><span className="truncate">Volver a {movie.title}</span>
        </button>
        <div className="flex items-center gap-4 bg-[#121318]/90 border border-neutral-800/80 px-4 py-2 rounded-xl backdrop-blur-md flex-shrink-0">
          <span className="text-xs font-mono font-bold text-neutral-400"><strong className="text-white">{String(idx + 1).padStart(2, '0')}</strong> / {String(total).padStart(2, '0')}</span>
          <div className="flex items-center gap-1 border-l border-neutral-800 pl-3">
            <button onClick={ant} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800" aria-label="Anterior"><ChevronUp size={18} /></button>
            <button onClick={sig} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800" aria-label="Siguiente"><ChevronDown size={18} /></button>
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center pb-12">
        <div className="hidden md:grid grid-cols-12 gap-8 items-center">
          <div className="col-span-4 lg:col-span-3 space-y-2 bg-[#121318]/60 border border-neutral-800/60 p-3 rounded-2xl backdrop-blur-md max-h-[580px] overflow-y-auto">
            <div className="px-3 py-2 border-b border-neutral-800/60 flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Reparto ({total})</span>
              <Clapperboard size={14} className="text-purple-400" />
            </div>
            {cast.map((c, i) => <Miembro key={c.id + '-' + i} m={c} activo={i === idx} onSelect={() => elegir(i)} />)}
          </div>
          <div className="col-span-8 lg:col-span-5 px-2"><Detalle m={m} titulo={movie.title} animando={animando} /></div>
          <div className="col-span-12 lg:col-span-4 flex items-end justify-center"><Imagen m={m} animando={animando} /></div>
        </div>

        <div className="flex md:hidden flex-col space-y-6">
          <Imagen m={m} animando={animando} />
          <Detalle m={m} titulo={movie.title} animando={animando} />
          <div className="pt-4 border-t border-neutral-800/80">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-3">Seleccionar</span>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {cast.map((c, i) => (
                <div key={c.id + '-' + i} onClick={() => elegir(i)}
                  className={`flex-none w-28 p-2 rounded-xl border cursor-pointer transition-all ${i === idx ? 'bg-purple-950/80 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'bg-[#121318]/80 border-neutral-800 opacity-70'}`}>
                  <div className="w-full h-24 rounded-lg overflow-hidden mb-2"><Foto src={c.photo} alt={c.name} iconSize={28} className="w-full h-full object-cover" /></div>
                  <span className="text-[10px] font-bold block truncate uppercase">{c.name}</span>
                  <span className="text-[9px] text-neutral-400 block truncate">{c.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
