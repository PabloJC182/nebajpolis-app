'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Percent, Calendar, Check } from 'lucide-react';
import { obtenerPromociones, elegirPromo, promoElegida, limpiarPromo, diasTexto, aplicaHoy } from '@/lib/promotions';

const fecha = (d) => (d ? new Date(d).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' }) : null);

export default function PromocionesPage() {
  const router = useRouter();
  const [promos, setPromos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [activa, setActiva] = useState(null);

  useEffect(() => {
    setActiva(promoElegida()?.id ?? null);
    obtenerPromociones().then(setPromos).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, []);

  const usar = (p) => { elegirPromo(p); setActiva(p.id); router.push('/cartelera'); };
  const quitar = () => { limpiarPromo(); setActiva(null); };

  return (
    <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">PROMOCIONES</h1>
      <p className="text-sm text-gray-400 mb-8">Elige una y se aplicará a tu próxima compra, si la función cumple sus condiciones</p>

      {cargando ? <p className="text-center text-gray-400 py-20">Cargando...</p>
        : error ? <p className="text-center text-red-400 py-20">{error}</p>
        : promos.length === 0 ? <p className="text-center text-gray-400 py-20">No hay promociones vigentes por ahora.</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {promos.map((p) => {
              const sel = activa === p.id;
              return (
                <div key={p.id} className={`bg-[#121318] border rounded-xl p-5 flex flex-col gap-4 ${sel ? 'border-purple-500' : 'border-neutral-800/80'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center font-black text-lg flex-shrink-0">
                      {p.discount}<Percent size={14} />
                    </div>
                    {sel && <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400"><Check size={14} />Seleccionada</span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-lg">{p.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{p.description}</p>
                  </div>
                  {p.validDays?.length > 0 && (
                    <p className="text-xs">
                      <span className="inline-block px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-200 font-bold">
                        Solo en funciones de {diasTexto(p.validDays)}
                      </span>
                      {aplicaHoy(p) && <span className="ml-2 text-emerald-400 font-bold">¡Hoy aplica!</span>}
                    </p>
                  )}
                  {(p.validFrom || p.validTo) && (
                    <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Calendar size={12} className="text-purple-400" />
                      {fecha(p.validFrom)} {p.validTo && `– ${fecha(p.validTo)}`}
                    </p>
                  )}
                  {sel ? (
                    <button onClick={quitar} className="py-2.5 rounded-xl border border-neutral-700 text-xs font-bold uppercase tracking-wider hover:border-white">Quitar</button>
                  ) : (
                    <button onClick={() => usar(p)} className="py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">Usar promoción</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </main>
  );
}
