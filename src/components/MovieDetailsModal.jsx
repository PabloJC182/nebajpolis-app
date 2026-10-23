'use client';

import Link from 'next/link';
import { X, Ticket, Sparkles } from 'lucide-react';

export default function MovieDetailsModal({ movie, onClose, onSelectHero }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-surface border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 border border-gray-700 text-gray-300 hover:text-white flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-64 sm:h-80 w-full">
          <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            {movie.tagline && (
              <span className="text-xs uppercase font-bold text-brand-400 bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 rounded">{movie.tagline}</span>
            )}
            <h2 className="text-3xl sm:text-4xl font-extrabold">{movie.title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3 text-xs md:text-sm">
              <span>{movie.year}</span>
              <span className="text-gray-500">•</span>
              <span className="border border-gray-600 px-1.5 py-0.5 rounded text-[10px] text-gray-300">{movie.rating}</span>
              <span className="text-gray-500">•</span>
              <span>{movie.duration}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/pelicula/${movie.id}`} className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-500 font-semibold text-xs tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all">
                <Ticket className="w-3.5 h-3.5" />
                COMPRAR BOLETOS
              </Link>
              <button onClick={() => onSelectHero(movie)} title="Destacar en portada" className="p-2.5 rounded-full bg-gray-800 border border-gray-600 text-gray-300 hover:text-white hover:border-white transition-all">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-gray-400 font-semibold text-[11px] tracking-wider">Sinopsis</h4>
              <p className="text-gray-300 leading-relaxed">{movie.synopsis}</p>
            </div>
            <div className="space-y-3 border-l border-gray-800 md:pl-6">
              {movie.cast && (
                <div>
                  <h4 className="text-gray-400 font-semibold text-[11px] tracking-wider mb-1">Reparto</h4>
                  <p className="text-gray-300 text-xs">{movie.cast}</p>
                </div>
              )}
              <div>
                <h4 className="text-gray-400 font-semibold text-[11px] tracking-wider mb-1">Géneros</h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {movie.genres.map((g) => (
                    <span key={g} className="bg-purple-950/50 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-[10px]">{g}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
