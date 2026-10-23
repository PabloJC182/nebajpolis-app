'use client';

import Link from 'next/link';
import { Ticket } from 'lucide-react';

export default function MovieCard({ movie }) {
  return (
    <Link
      href={`/pelicula/${movie.id}`}
      className="group relative block rounded-lg overflow-hidden bg-gray-900 border border-gray-800/80 transition-all duration-300 hover:scale-105 hover:z-30 hover:border-brand-500/50 hover:shadow-xl hover:shadow-purple-900/20"
    >
      <div className="aspect-[2/3] w-full relative overflow-hidden">
        {movie.rating && <span className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm border border-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded">{movie.rating}</span>}
        {movie.preventa && <span className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded">PREVENTA</span>}
        <img src={movie.poster} alt={movie.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-300">{movie.year}</span>
            <span />
          </div>
          <h3 className="text-white text-xs md:text-sm font-bold truncate mb-2">{movie.title}</h3>
          <div className="flex flex-wrap gap-1 mb-2">
            {movie.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-[9px] text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">{g}</span>
            ))}
          </div>
          <span className="flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-brand-600 text-[10px] font-semibold tracking-wider">
            <Ticket className="w-3 h-3" />
            COMPRAR
          </span>
        </div>
      </div>
    </Link>
  );
}
