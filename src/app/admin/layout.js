'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Film, CalendarClock, Percent, Popcorn, Receipt, Users, Clapperboard, ScanLine, Banknote, Building2, DoorOpen, Images, BarChart3, Wallet, UserCog, Boxes, TicketPercent, Package, ScrollText, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { ETIQUETAS, esPersonal, puedeVer, inicioPara, leerUsuario, guardarRol } from '@/lib/roles';

const SECCIONES = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exacto: true },
  { href: '/admin/peliculas', label: 'Películas', icon: Film },
  { href: '/admin/cines', label: 'Cines', icon: Building2 },
  { href: '/admin/salas', label: 'Salas y asientos', icon: DoorOpen },
  { href: '/admin/funciones', label: 'Funciones', icon: CalendarClock },
  { href: '/admin/personas', label: 'Personas', icon: Users },
  { href: '/admin/reparto', label: 'Reparto', icon: Clapperboard },
  { href: '/admin/promociones', label: 'Promociones', icon: Percent },
  { href: '/admin/banners', label: 'Banners', icon: Images },
  { href: '/admin/comida', label: 'Comida', icon: Popcorn },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes },
  { href: '/admin/combos', label: 'Combos', icon: Package },
  { href: '/admin/cupones', label: 'Cupones', icon: TicketPercent },
  { href: '/admin/taquilla', label: 'Taquilla', icon: Banknote },
  { href: '/admin/ventas', label: 'Ventas', icon: Receipt },
  { href: '/admin/validar', label: 'Validar entradas', icon: ScanLine },
  { href: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/admin/corte', label: 'Corte de caja', icon: Wallet },
  { href: '/admin/datos', label: 'Datos y reportes', icon: KeyRound },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ScrollText },
  { href: '/admin/usuarios', label: 'Usuarios y roles', icon: UserCog },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [rol, setRol] = useState(null);

  // Guardia de cliente: la seguridad real la aplica el back. El rol se refresca desde /auth/me
  // (un cambio de rol hecho por el admin se nota sin volver a iniciar sesión).
  useEffect(() => {
    let vivo = true;
    if (!localStorage.getItem('token')) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; }
    const aplicar = (r) => {
      if (!vivo) return;
      if (!esPersonal(r)) return router.replace('/');
      if (!puedeVer(r, pathname)) return router.replace(inicioPara(r));
      setRol(r);
    };
    aplicar(leerUsuario()?.role);
    api('/auth/me').then((u) => { guardarRol(u.role); aplicar(u.role); }).catch(() => {});
    return () => { vivo = false; };
  }, [router, pathname]);

  if (!rol || !puedeVer(rol, pathname)) return <p className="relative z-10 pt-40 text-center text-gray-400 min-h-screen">Verificando acceso...</p>;
  const secciones = SECCIONES.filter((s) => puedeVer(rol, s.href));

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 min-h-screen grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 self-start">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold mb-3 hidden lg:block">{rol === 'admin' ? 'Administración' : `Panel · ${ETIQUETAS[rol]}`}</p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {secciones.map(({ href, label, icon: Icon, exacto }) => {
            const activo = exacto ? pathname === href : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${activo ? 'bg-purple-600/20 text-white border border-purple-500/40' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <Icon size={16} className={activo ? 'text-purple-400' : ''} /> {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
