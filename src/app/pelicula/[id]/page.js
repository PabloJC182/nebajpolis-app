import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Users } from 'lucide-react';
import { obtenerPelicula, esProxima } from '@/lib/movies';
import { TZ } from '@/lib/adapters';
import { obtenerFuncionesDePelicula } from '@/lib/booking';
import ReviewsSection from '@/components/ReviewsSection';
import FuncionesPanel from '@/components/FuncionesPanel';
import TrailerButton from '@/components/TrailerButton';

export default async function PeliculaPage({ params }) {
  let movie = null;
  let errorMsg = '';
  try {
    movie = await obtenerPelicula(params.id);
  } catch (e) {
    // Solo un 404 real de la API es "no encontrada"; cualquier otro error se muestra
    if (e.status !== 404) errorMsg = e.message;
  }
  if (errorMsg) {
    return <main className="relative z-10 pt-40 px-6 text-center text-red-400 min-h-screen">{errorMsg}</main>;
  }
  if (!movie) notFound();

  const funciones = await obtenerFuncionesDePelicula(params.id).catch(() => []);
  const proxima = esProxima(movie);
  const estreno = proxima ? new Date(`${String(movie.releaseDate).slice(0, 10)}T12:00:00-06:00`).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }) : '';

  return (
    <main className="relative z-10 pb-20">
      <div className="relative h-[50vh] min-h-[360px]">
        <img src={movie.backdrop} alt={movie.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute bottom-8 px-6 md:px-12 space-y-2">
          <h1 className="text-4xl md:text-6xl font-black">{movie.title}</h1>
          {proxima && (
            <p className="inline-block text-[11px] font-black tracking-wider bg-gradient-to-r from-fuchsia-600 to-purple-600 px-3 py-1 rounded-full">
              {funciones.length > 0 ? `PREVENTA · ESTRENO ${estreno.toUpperCase()}` : `PRÓXIMAMENTE · ESTRENO ${estreno.toUpperCase()}`}
            </p>
          )}
          <p className="text-sm text-gray-300">{[movie.year, movie.rating, movie.duration, movie.genres.join(', ')].filter(Boolean).join(' • ')}</p>
        </div>
      </div>
      <div className="px-6 md:px-12 grid md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-6">
          <p className="text-gray-300 leading-relaxed">{movie.synopsis}</p>
          {movie.cast && <p className="text-sm text-gray-400"><span className="font-semibold text-gray-200">Reparto:</span> {movie.cast}</p>}
          <div className="flex flex-wrap gap-3">
            <TrailerButton videoId={movie.trailerId} titulo={movie.title} />
          </div>
          {movie.castCount > 0 && (
            <Link href={`/pelicula/${movie.id}/reparto`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-purple-500/40 hover:bg-purple-600/20 text-xs font-bold uppercase tracking-wider transition-colors">
              <Users size={14} /> Ver reparto completo
            </Link>
          )}
          <ReviewsSection movieId={movie.id} />
        </div>
        <FuncionesPanel funciones={funciones} vacio={proxima ? `Aún no abrimos la venta. Estreno: ${estreno}.` : undefined} />
      </div>
    </main>
  );
}
