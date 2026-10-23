'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { lista } from '@/lib/adapters';

// Cine elegido por el visitante ('' = todos). Se guarda en este navegador y se comparte entre componentes.
const KEY = 'cineId';
const EVENTO = 'cine-change';

export const leerCine = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
export const guardarCine = (id) => {
  try { id ? localStorage.setItem(KEY, String(id)) : localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event(EVENTO));
};

export function useCine() {
  const [cineId, setCineId] = useState('');
  useEffect(() => {
    const sync = () => setCineId(leerCine());
    sync();
    window.addEventListener(EVENTO, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENTO, sync); window.removeEventListener('storage', sync); };
  }, []);
  return [cineId, useCallback((id) => guardarCine(id), [])];
}

// Cines (públicos) ordenados por ciudad y nombre
export async function obtenerCines() {
  return lista(await api('/cinemas'))
    .map((c) => ({ id: String(c.id), name: c.name, city: c.city || 'Otras ciudades', address: c.address || '', phone: c.phone || '' }))
    .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
}

// Salas agrupadas por id de cine
export async function obtenerSalasPorCine() {
  const porCine = {};
  lista(await api('/rooms')).forEach((r) => {
    const id = String(r.cinemaId ?? r.cinema?.id ?? '');
    (porCine[id] ??= []).push({ id: String(r.id), name: r.name, type: r.roomType || '2D', seats: Number(r.seatCount ?? r.capacity ?? 0) });
  });
  return porCine;
}
