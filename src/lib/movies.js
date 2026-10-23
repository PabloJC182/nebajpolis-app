import { api } from '@/lib/api';
import { EP, USE_MOCK } from '@/lib/endpoints';
import { adaptarPelicula, adaptarPersona, lista, diaGT } from '@/lib/adapters';
import { MOVIES_DATA } from '@/data/movies.mock';
import { obtenerFuncionesProximas } from '@/lib/booking';

// Cartelera activa (películas con status = true)
export async function obtenerPeliculas() {
  if (USE_MOCK) return MOVIES_DATA;
  // Las de fecha de estreno futura van en "Próximamente", no en cartelera
  return lista(await api(EP.moviesActivas)).map(adaptarPelicula).filter((m) => !esProxima(m));
}

export const esProxima = (m) => !!m.releaseDate && String(m.releaseDate).slice(0, 10) > diaGT(new Date());

// Próximos estrenos: películas activas con fecha de estreno posterior a hoy (la más cercana primero)
export async function obtenerProximos() {
  if (USE_MOCK) return [];
  return lista(await api(EP.movies))
    .filter((m) => m.status !== false)
    .map(adaptarPelicula)
    .filter(esProxima)
    .sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)));
}

// Preventa = estreno futuro que ya tiene funciones a la venta
export const conPreventa = (proximos, funciones) =>
  proximos.map((m) => {
    const fs = funciones.filter((f) => f.movieId === m.id);
    return { ...m, preventa: fs.length > 0, funcionesCount: fs.length };
  });

export async function obtenerProximosConPreventa() {
  const [proximos, funciones] = await Promise.all([obtenerProximos(), obtenerFuncionesProximas().catch(() => [])]);
  return conPreventa(proximos, funciones);
}

export async function obtenerPelicula(id) {
  if (USE_MOCK) return MOVIES_DATA.find((m) => m.id === id) ?? null;
  return adaptarPelicula(await api(EP.movie(id)));
}

export const extraerGeneros = (peliculas) => [...new Set(peliculas.flatMap((m) => m.genres))].sort();

// Película + reparto detallado (GET /movies/:id incluye people)
export async function obtenerReparto(id) {
  if (USE_MOCK) {
    const movie = MOVIES_DATA.find((m) => m.id === id) ?? MOVIES_DATA[0];
    const cast = [
      { id: 1, fullName: 'Actor de ejemplo', movieCast: { role: 'Protagonista' }, biography: 'Biografía de ejemplo.', birthDate: '1990-05-12' },
      { id: 2, fullName: 'Actriz de ejemplo', movieCast: { role: 'Secundaria' }, biography: 'Biografía de ejemplo.' },
    ].map(adaptarPersona);
    return { movie, cast };
  }
  const raw = await api(EP.movie(id));
  return { movie: adaptarPelicula(raw), cast: (raw.people ?? raw.persons ?? []).map(adaptarPersona) };
}
