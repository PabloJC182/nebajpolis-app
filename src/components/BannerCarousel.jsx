'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { obtenerBanners } from '@/lib/banners';

const INTERVALO = 6000;

// Carrusel de banners promocionales (los administra el admin). Si no hay banners, no se muestra.
export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);

  useEffect(() => { obtenerBanners().then(setBanners).catch(() => {}); }, []);

  const total = banners.length;
  const ir = useCallback((n) => setI((n + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausa) return;
    const t = setInterval(() => setI((x) => (x + 1) % total), INTERVALO);
    return () => clearInterval(t);
  }, [total, pausa]);

  if (total === 0) return null;
  const b = banners[Math.min(i, total - 1)];
  const externo = b.link?.startsWith('https://');
  const cta = b.link && (externo
    ? <a href={b.link} target="_blank" rel="noopener noreferrer" className="inline-block self-start mt-2 sm:mt-3 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider">{b.button}</a>
    : <Link href={b.link} className="inline-block self-start mt-2 sm:mt-3 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider">{b.button}</Link>);

  return (
    <section aria-roledescription="carrusel" aria-label="Promociones y novedades" className="px-6 md:px-12"
      onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 aspect-[2/1] sm:aspect-[5/2] lg:aspect-[3/1] bg-[#121318]">
        {banners.map((x, n) => (
          <img key={x.id} src={x.image} alt={x.title} loading={n === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${n === i ? 'opacity-100' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:via-black/30" />
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center py-4 pl-5 pr-4 sm:py-6 sm:pl-14 sm:pr-8 lg:pl-16 max-w-[85%] sm:max-w-[60%]">
          <h2 className="text-base sm:text-2xl lg:text-4xl font-black leading-tight drop-shadow">{b.title}</h2>
          {b.subtitle && <p className="text-xs sm:text-sm lg:text-base text-gray-200 mt-1 line-clamp-2 drop-shadow">{b.subtitle}</p>}
          {cta}
        </div>
        {total > 1 && (
          <>
            <button onClick={() => ir(i - 1)} aria-label="Anterior" className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80"><ChevronLeft size={18} /></button>
            <button onClick={() => ir(i + 1)} aria-label="Siguiente" className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/80"><ChevronRight size={18} /></button>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {banners.map((x, n) => (
                <button key={x.id} onClick={() => setI(n)} aria-label={`Banner ${n + 1}`} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
