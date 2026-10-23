'use client';

import { useEffect, useMemo, useState } from 'react';
import { obtenerPeliculas, obtenerProximosConPreventa } from '@/lib/movies';
import HeroMovie from '@/components/HeroMovie';
import MovieCarousel from '@/components/MovieCarousel';
import BannerCarousel from '@/components/BannerCarousel';
import MovieDetailsModal from '@/components/MovieDetailsModal';

export default function HomePage() {
  const [peliculas, setPeliculas] = useState([]);
  const [hero, setHero] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preventas, setPreventas] = useState([]);
  const [estado, setEstado] = useState({ cargando: true, error: '' });

  useEffect(() => {
    obtenerPeliculas()
      .then((lista) => { setPeliculas(lista); setHero(lista[0] ?? null); })
      .catch((e) => setEstado({ cargando: false, error: e.message }))
      .finally(() => setEstado((s) => ({ ...s, cargando: false })));
  }, []);

  useEffect(() => { obtenerProximosConPreventa().then((l) => setPreventas(l.filter((m) => m.preventa))).catch(() => {}); }, []);

  const recientes = useMemo(
    () => [...peliculas].sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate))).slice(0, 10),
    [peliculas]
  );

  if (estado.cargando) return <p className="relative z-10 pt-40 text-center text-gray-400">Cargando cartelera...</p>;
  if (estado.error) return <p className="relative z-10 pt-40 px-6 text-center text-red-400">{estado.error}</p>;
  if (!hero) return <p className="relative z-10 pt-40 text-center text-gray-400">No hay películas en cartelera.</p>;

  return (
    <>
      <HeroMovie movie={hero} onMoreInfo={() => setSelected(hero)} />
      <main className="relative z-10 -mt-24 md:-mt-32 pb-20 space-y-8 md:space-y-12">
        <div className="pt-24 md:pt-32 -mb-16 md:-mb-24"><BannerCarousel /></div>
        <MovieCarousel title="EN CARTELERA" movies={peliculas} />
        {preventas.length > 0 && <MovieCarousel title="PREVENTAS · COMPRA TUS BOLETOS ANTES DEL ESTRENO" movies={preventas} />}
        {peliculas.length > 3 && <MovieCarousel title="ESTRENOS RECIENTES" movies={recientes} />}
      </main>
      {selected && (
        <MovieDetailsModal
          movie={selected}
          onClose={() => setSelected(null)}
          onSelectHero={(m) => { setHero(m); setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}
    </>
  );
}
