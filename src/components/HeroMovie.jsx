'use client';

import Link from 'next/link';
import { Ticket, Info } from 'lucide-react';

export default function HeroMovie({ movie, onMoreInfo }) {
  return (
    <div className="relative w-full h-[68vh] md:h-[75vh] min-h-[500px] overflow-hidden flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover scale-105 brightness-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent w-full md:w-2/3" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-transparent to-transparent h-32" />
      </div>

      <div className="relative z-10 px-6 md:px-12 max-w-2xl mt-12 space-y-4">
        {movie.tagline && <span className="text-xs uppercase font-bold tracking-widest text-brand-400 bg-purple-950/60 border border-purple-500/30 px-2.5 py-1 rounded-md">
          {movie.tagline}
        </span>}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none drop-shadow-lg">{movie.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-300">
          <span>{movie.year}</span>
          <span className="text-gray-500">•</span>
          <span className="border border-gray-600 px-1.5 py-0.5 rounded text-[10px]">{movie.rating}</span>
          <span className="text-gray-500">•</span>
          <span>{movie.duration}</span>
        </div>
        <p className="text-gray-300 text-xs sm:text-sm line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl">{movie.synopsis}</p>
        <div className="flex items-center gap-4 mb-10">
          <Link
            href={`/pelicula/${movie.id}`}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-xs md:text-sm tracking-wider flex items-center gap-2.5 shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all "
          >
            <Ticket className="w-4 h-4" />
            COMPRAR BOLETOS
          </Link>
          <button
            onClick={onMoreInfo}
            title="Más información"
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-gray-400/50 hover:border-white hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
