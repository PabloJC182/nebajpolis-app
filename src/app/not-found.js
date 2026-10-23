import Link from 'next/link';
import { Film, Home, Clapperboard } from 'lucide-react';

export const metadata = { title: 'Página no encontrada | Nebajpolis' };

export default function NotFound() {
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="relative inline-block">
          <span className="block text-[9rem] sm:text-[12rem] leading-none font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-fuchsia-500 to-purple-900/20 select-none">404</span>
          <Film className="absolute -top-2 -right-4 sm:-right-8 w-12 h-12 text-purple-400 rotate-12" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Esta escena no está en el guion</h1>
          <p className="text-sm sm:text-base text-gray-400">
            La página que buscas no existe, cambió de lugar o la función ya terminó. Vuelve al lobby y elige otra película.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/25">
            <Home size={16} /> Ir al inicio
          </Link>
          <Link href="/cartelera" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-500/40 hover:bg-purple-600/20 text-xs font-bold uppercase tracking-wider">
            <Clapperboard size={16} /> Ver cartelera
          </Link>
        </div>
      </div>
    </main>
  );
}
