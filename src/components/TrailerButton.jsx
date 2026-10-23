'use client';

import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';

export default function TrailerButton({ videoId, titulo }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto]);

  if (!videoId) return null;
  return (
    <>
      <button onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/25">
        <Play size={14} className="fill-white" /> Ver tráiler
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setAbierto(false)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold truncate">{titulo} · Tráiler</p>
              <button onClick={() => setAbierto(false)} className="p-2 text-gray-300 hover:text-white" aria-label="Cerrar"><X size={22} /></button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-black">
              <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={`Tráiler de ${titulo}`}
                allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
