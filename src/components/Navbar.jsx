'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Play, Search, X, Bell, LogOut } from 'lucide-react';
import { cerrarSesion } from '@/lib/auth';
import SelectorCine from '@/components/SelectorCine';
import { esPersonal, inicioPara } from '@/lib/roles';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Cartelera', href: '/cartelera' },
  { label: 'Próximamente', href: '/proximamente' },
  { label: 'Dulcería', href: '/dulceria' },
  { label: 'Promociones', href: '/promociones' },
  { label: 'Cines', href: '/cines' },
  { label: 'Mis boletos', href: '/mis-boletos' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    try { setUsuario(localStorage.getItem('token') ? JSON.parse(localStorage.getItem('usuario') || 'null') ?? { fullName: 'Mi cuenta' } : null); } catch { setUsuario(null); }
  }, [pathname]);

  const salir = () => { cerrarSesion(); setUsuario(null); router.push('/'); };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  const buscar = (e) => {
    e.preventDefault();
    if (query.trim()) router.push(`/cartelera?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 px-6 md:px-12 py-4 flex items-center justify-between ${
      isScrolled ? 'bg-ink/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
    }`}>
      <div className="flex items-center gap-8 md:gap-12">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
          <span className="text-lg md:text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-purple-300">
            NEBAJPOLIS
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-medium">
          {NAV_ITEMS.map(({ label, href }) => {
            const activo = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`relative py-1 whitespace-nowrap transition-colors hover:text-white ${activo ? 'text-white font-semibold' : 'text-gray-400'}`}>
                {label}
                {activo && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <SelectorCine className="hidden 2xl:flex" />
        {isSearchOpen ? (
          <form onSubmit={buscar} className="flex items-center bg-gray-900/90 border border-purple-500/40 rounded-full px-3 py-1.5 w-48 sm:w-64">
            <Search className="w-4 h-4 text-brand-400 mr-2 flex-shrink-0" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar películas, géneros..." className="bg-transparent text-xs text-white placeholder-gray-400 outline-none w-full" />
            <button type="button" onClick={() => { setIsSearchOpen(false); setQuery(''); }} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5 ml-1" />
            </button>
          </form>
        ) : (
          <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
        )}
        <button className="hidden sm:block p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10" aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
        </button>
        {usuario ? (
          <div className="flex items-center gap-3">
            {esPersonal(usuario.role) && <Link href={inicioPara(usuario.role)} className="hidden sm:block text-xs font-semibold tracking-wider text-purple-300 hover:text-white">{usuario.role === 'admin' ? 'ADMIN' : 'PANEL'}</Link>}
            <Link href="/perfil" className="hidden sm:block text-xs text-gray-300 hover:text-white max-w-[120px] truncate">{usuario.fullName?.split(' ')[0]}</Link>
            <button onClick={salir} className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10" aria-label="Cerrar sesión"><LogOut className="w-5 h-5" /></button>
          </div>
        ) : (
          <Link href="/login" className="px-4 py-2 rounded-full border border-purple-500/40 text-xs font-semibold tracking-wider hover:bg-purple-600 transition-colors">
            INGRESAR
          </Link>
        )}
      </div>
    </nav>
  );
}
