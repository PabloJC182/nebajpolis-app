// Rutas reales de cine-api (colección Postman). Base: NEXT_PUBLIC_API_URL = http://localhost:8081/api
export const EP = {
  signin: '/auth/signin',
  signup: '/auth/signup',
  genres: '/genre',
  movies: '/movies',
  moviesActivas: '/movies/activas',
  movie: (id) => `/movies/${id}`,
  showsByMovie: (id) => `/shows?movieId=${id}&upcoming=1`,
  show: (id) => `/shows/${id}`,
  showSeats: (id) => `/shows/${id}/seats`,
  promosVigentes: '/promotions/vigentes',
  salesCreate: '/sales/create/',
  misVentas: '/sales/mias',
  sale: (id) => `/sales/${id}`,
  paymentIntent: '/pago/crear-payment-intent',
  reviews: (movieId) => `/reviews?movieId=${movieId}`,
  food: '/food',
};
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
