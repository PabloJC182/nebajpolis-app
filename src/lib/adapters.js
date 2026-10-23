// Convierte la respuesta de cine-api al formato que usa la UI
// Acepta arreglo directo o envuelto ({ data | rows | items })
export const lista = (r) => (Array.isArray(r) ? r : r?.data ?? r?.rows ?? r?.items ?? []);

// Id de video de YouTube a partir de watch?v=, youtu.be/, embed/ o shorts/
export const youtubeId = (url) => {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
};

const dur = (min) => (min ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '');

// Persona del reparto: fullName + rol (movieCast.role)
const nombre = (p) => {
  const rol = p?.movieCast?.role;
  const n = p?.fullName ?? p?.name ?? '';
  return rol ? `${n} (${rol})` : n;
};

const SIN_IMAGEN =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'><rect width='100%' height='100%' fill='#171923'/><text x='50%' y='50%' fill='#6b7280' font-family='sans-serif' font-size='28' text-anchor='middle'>Sin imagen</text></svg>"
  );

export const adaptarPelicula = (m) => {
  const poster = m.posterUrl || SIN_IMAGEN;
  return {
    id: String(m.id),
    title: m.title,
    tagline: m.originalLanguage ? `Idioma original: ${m.originalLanguage}` : '',
    year: m.releaseDate ? new Date(m.releaseDate).getUTCFullYear() : '',
    releaseDate: m.releaseDate ?? '',
    rating: m.rating,
    duration: dur(m.durationMinutes),
    genres: (m.genres ?? []).map((g) => g.name ?? g),
    synopsis: m.synopsis,
    cast: (m.people ?? m.persons ?? []).map(nombre).filter(Boolean).join(', '),
    castCount: (m.people ?? m.persons ?? []).length,
    trailerId: youtubeId(m.trailerUrl),
    poster,
    backdrop: m.backdropUrl || m.posterUrl || SIN_IMAGEN,
    category: 'trending',
    featured: false,
  };
};

// Las paginas de servidor corren en UTC: se fija la zona horaria de Guatemala para fechas y horas
export const TZ = 'America/Guatemala';
export const diaGT = (fecha) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
export const adaptarFuncion = (s) => {
  const f = new Date(s.showDatetime);
  return {
    id: String(s.id),
    movieId: String(s.movieId ?? s.movie?.id ?? ''),
    movie: s.movie ? adaptarPelicula(s.movie) : null,
    room: s.room?.name ?? '',
    cinema: s.room?.cinema?.name ?? '',
    cinemaId: String(s.room?.cinema?.id ?? s.room?.cinemaId ?? ''),
    iso: s.showDatetime,
    dayKey: diaGT(f),
    date: String(parseInt(diaGT(f).slice(8), 10)),
    month: MESES[parseInt(diaGT(f).slice(5, 7), 10) - 1],
    time: f.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit', timeZone: TZ }),
    format: s.format ?? '',
    pricePerSeat: Number(s.basePrice ?? 0),
    currency: 'Q',
  };
};

// Asientos de /shows/:id/seats ({ id, rowLabel, seatNumber, seatType, available })
export const adaptarAsiento = (a) => {
  const ocupado =
    a.available === false ||
    a.isAvailable === false ||
    a.occupied === true ||
    ['occupied', 'sold', 'held', 'reserved', 'ocupado', 'unavailable'].includes(a.status ?? a.availability);
  return {
    id: String(a.id ?? a.seatId),
    row: a.rowLabel,
    number: a.seatNumber,
    type: a.seatType,
    status: ocupado || a.seatType === 'disabled' ? 'occupied' : 'available',
  };
};

// Reparto detallado: persona (fullName, photoUrl, biography, birthDate) + rol (movieCast.role)
export const adaptarPersona = (p, i) => ({
  id: String(p.id ?? i),
  order: String(i + 1).padStart(2, '0'),
  name: p.fullName ?? p.name ?? 'Sin nombre',
  role: p.movieCast?.role ?? 'Reparto',
  bio: p.biography ?? '',
  birthDate: p.birthDate ?? '',
  photo: p.photoUrl || '',
});
