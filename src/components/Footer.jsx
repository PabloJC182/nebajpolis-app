import Link from 'next/link';

const COLUMNAS = [
  { titulo: 'Explora', enlaces: [['Cartelera', '/cartelera'], ['Próximamente', '/proximamente'], ['Dulcería', '/dulceria'], ['Promociones', '/promociones'], ['Nuestros cines', '/cines']] },
  { titulo: 'Tu cuenta', enlaces: [['Mis boletos', '/mis-boletos'], ['Mi perfil', '/perfil'], ['Ingresar', '/login']] },
  { titulo: 'Ayuda', enlaces: [['Contáctenos', '/contacto'], ['Términos y condiciones', '/terminos'], ['Aviso de privacidad', '/privacidad']] },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800/60 py-10 px-6 md:px-12 text-xs text-gray-500">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1 space-y-2">
          <p className="text-sm font-black tracking-wider text-white">NEBAJPOLIS</p>
          <p className="text-gray-500 max-w-[220px]">Tu cartelera y tus boletos de cine, en línea.</p>
        </div>
        {COLUMNAS.map((c) => (
          <nav key={c.titulo} aria-label={c.titulo} className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">{c.titulo}</p>
            <ul className="space-y-1.5">
              {c.enlaces.map(([label, href]) => <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <p className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800/60 text-center">© 2026 Nebajpolis. Todos los derechos reservados.</p>
    </footer>
  );
}
