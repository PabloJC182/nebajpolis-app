// Datos de prueba (títulos ficticios). Se usan solo con NEXT_PUBLIC_USE_MOCK=true
const foto = (id, w) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
const peli = (id, title, tagline, year, rating, duration, genres, foto_id, synopsis, cast, category, featured = false) => ({
  id, title, tagline, year, releaseDate: `${year}-01-01`, rating, duration, genres, synopsis, cast, category, featured,
  backdrop: foto(foto_id, 1920), poster: foto(foto_id, 600),
});

export const MOVIES_DATA = [
  peli('valle-encantado', 'VALLE ENCANTADO', 'Estreno familiar', 2025, 'PG', '1h 42m', ['Animación', 'Familia', 'Fantasía'], '1534447677768-be436bb09401',
    'Una familia vive escondida en las montañas, en un valle donde cada hijo recibe un don especial. Todos menos Mirabel.', 'Ana Rivas, Luis Ortega, Marta Sol', 'trending', true),
  peli('cazador-estelar', 'CAZADOR ESTELAR', 'Aventura espacial', 2025, 'PG-13', '2h 05m', ['Ciencia ficción', 'Acción'], '1518709268805-4e9042af9f23',
    'Un cazador de recompensas viaja por los confines de la galaxia lejos de toda autoridad.', 'Diego Paz, Carla Ruiz', 'trending'),
  peli('runner-2099', 'CYBER RUNNER 2099', 'Ciberpunk', 2026, 'PG-13', '2h 15m', ['Ciberpunk', 'Acción'], '1607604276583-eef5d076aa5f',
    'En una metrópolis de neón, un hacker descubre una red que amenaza la conciencia humana.', 'Iván Mora, Elena Vidal', 'trending'),
  peli('odisea-interestelar', 'ODISEA INTERESTELAR', 'Épica de ciencia ficción', 2024, 'PG-13', '2h 49m', ['Ciencia ficción', 'Drama'], '1451187580459-43490279c0fa',
    'Un equipo cruza un agujero de gusano para asegurar la supervivencia de la humanidad.', 'Marco Silva, Nora Prieto', 'popular'),
  peli('sombras-neon', 'SOMBRAS DE NEÓN', 'Acción sin freno', 2025, 'R', '1h 58m', ['Acción', 'Suspenso'], '1509198397868-475647b2a1e5',
    'Un exasesino vuelve al hampa cuando un viejo socio amenaza con exponer al sindicato.', 'Raúl Cano, Bea Luna', 'popular'),
  peli('guardianes-oceano', 'GUARDIANES DEL OCÉANO', 'Documental', 2025, 'G', '1h 28m', ['Documental', 'Naturaleza'], '1544551763-46a013bb70d5',
    'Un recorrido por los reinos submarinos y las criaturas que habitan las profundidades.', 'Voz de Sofía Marín', 'popular'),
];
