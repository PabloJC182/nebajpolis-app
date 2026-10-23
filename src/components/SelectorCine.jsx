'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { obtenerCines, useCine } from '@/lib/cine';

// Selector de cine agrupado por ciudad. El valor elegido filtra la cartelera y las funciones.
export default function SelectorCine({ className = '' }) {
  const [cines, setCines] = useState([]);
  const [cineId, setCine] = useCine();

  useEffect(() => { obtenerCines().then(setCines).catch(() => {}); }, []);

  const ciudades = useMemo(() => {
    const m = new Map();
    cines.forEach((c) => (m.get(c.city) ?? m.set(c.city, []).get(c.city)).push(c));
    return [...m.entries()];
  }, [cines]);

  // Si el cine guardado ya no existe, se ignora
  const valor = cines.some((c) => c.id === cineId) ? cineId : '';
  if (cines.length === 0) return null;

  return (
    <label className={`flex items-center gap-1.5 bg-gray-900/80 border border-gray-700 rounded-full pl-3 pr-2 py-1.5 text-xs text-gray-200 focus-within:border-purple-500 ${className}`}>
      <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
      <select value={valor} onChange={(e) => setCine(e.target.value)} aria-label="Elegir cine"
        className="bg-transparent outline-none max-w-[170px] truncate cursor-pointer">
        <option value="" className="bg-[#121318]">Todos los cines</option>
        {ciudades.map(([ciudad, lista]) => (
          <optgroup key={ciudad} label={ciudad} className="bg-[#121318]">
            {lista.map((c) => <option key={c.id} value={c.id} className="bg-[#121318]">{c.name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
