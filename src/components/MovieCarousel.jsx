'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieCarousel({ title, movies }) {
  const rowRef = useRef(null);

  const desplazar = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + (dir === 'left' ? -1 : 1) * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  const flecha = 'absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 border border-purple-500/30 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-brand-600 transition-all shadow-xl';

  return (
    <div className="px-16 md:px-24 group/carousel relative pt-24 md:pt-32">
      <h2 className="text-base md:text-lg font-bold tracking-wider text-gray-200 mb-10 mt-10">{title}</h2>
      <div className="relative">
        <button onClick={() => desplazar('left')} className={`${flecha} left-0 -translate-x-3 md:-translate-x-5`} aria-label="Anterior">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div ref={rowRef} className="flex items-center gap-3 md:gap-4 overflow-x-auto py-2 px-1 scroll-smooth " style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {movies.map((m) => (
            <div key={m.id} className="flex-shrink-0 w-36 sm:w-44 md:w-52">
              <MovieCard movie={m} />
            </div>
          ))}
        </div>
        <button onClick={() => desplazar('right')} className={`${flecha} right-0 translate-x-3 md:translate-x-5`} aria-label="Siguiente">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
