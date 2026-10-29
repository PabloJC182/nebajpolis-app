'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cerrarSesion } from '@/lib/auth';

// Cierre de sesión por inactividad: a los 15 minutos sin actividad se pregunta si se quiere seguir;
// si no se responde en 60 segundos (o se elige salir), la sesión se cierra.
const LIMITE = Number(process.env.NEXT_PUBLIC_INACTIVIDAD_SEG || 15 * 60) * 1000;
const AVISO = Number(process.env.NEXT_PUBLIC_AVISO_SEG || 60) * 1000;
const CLAVE = 'nbp_actividad';
const EVENTOS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

const leer = () => { try { return Number(localStorage.getItem(CLAVE)) || 0; } catch { return 0; } };
const borrar = () => { try { localStorage.removeItem(CLAVE); } catch {} };
const marcar = () => { try { localStorage.setItem(CLAVE, String(Date.now())); } catch {} };
const hayToken = () => { try { return !!localStorage.getItem('token'); } catch { return false; } };

export default function SesionInactiva() {
  const [restante, setRestante] = useState(null); // null = sin aviso; número = segundos que faltan
  const aviso = useRef(false);
  const ultimoRegistro = useRef(0);
  const botonRef = useRef(null);

  const salir = useCallback(() => {
    cerrarSesion();
    borrar();
    window.location.assign('/login?inactividad=1');
  }, []);

  const seguir = useCallback(() => { aviso.current = false; setRestante(null); marcar(); }, []);

  useEffect(() => {
    // Mientras se muestra el aviso, el movimiento del mouse NO cuenta: hay que responder con el botón
    const actividad = () => {
      if (aviso.current || !hayToken()) return;
      const ahora = Date.now();
      if (ahora - ultimoRegistro.current > 5000) { ultimoRegistro.current = ahora; marcar(); }
    };
    EVENTOS.forEach((e) => window.addEventListener(e, actividad, { passive: true }));

    // Se compara con marcas de tiempo (no con un temporizador largo) para que funcione aunque la pestaña esté en segundo plano
    const t = setInterval(() => {
      if (!hayToken()) { aviso.current = false; setRestante(null); borrar(); return; } // sin sesión: nada que vigilar
      if (!leer()) marcar(); // acaba de iniciar sesión
      const inactivo = Date.now() - leer();
      if (inactivo >= LIMITE + AVISO) return salir();
      if (inactivo >= LIMITE) { aviso.current = true; setRestante(Math.ceil((LIMITE + AVISO - inactivo) / 1000)); }
      else if (aviso.current) { aviso.current = false; setRestante(null); } // se contestó en otra pestaña
    }, 1000);
    return () => { EVENTOS.forEach((e) => window.removeEventListener(e, actividad)); clearInterval(t); };
  }, [salir]);

  useEffect(() => { if (restante !== null) botonRef.current?.focus(); }, [restante === null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (restante === null) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="alertdialog" aria-modal="true" aria-labelledby="inact-titulo" aria-describedby="inact-desc">
      <div className="w-full max-w-sm rounded-2xl bg-[#121318] border border-purple-500/30 p-6 text-center space-y-4 shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-purple-900/40 border border-purple-500/40 flex items-center justify-center"><Clock className="w-6 h-6 text-purple-300" /></div>
        <h2 id="inact-titulo" className="text-lg font-black">¿Sigues ahí?</h2>
        <p id="inact-desc" className="text-sm text-gray-300">Por seguridad, tu sesión se cerrará por inactividad en <b className="text-white tabular-nums">{restante}</b> segundo{restante === 1 ? '' : 's'}. ¿Quieres seguir usando tu cuenta?</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button ref={botonRef} onClick={seguir} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">Seguir con mi sesión</button>
          <button onClick={salir} className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-white text-xs font-bold uppercase tracking-wider">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
