'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { api } from '@/lib/api';

const inputCls = 'w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500';

export default function RepartoAdmin() {
  const [peliculas, setPeliculas] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [movieId, setMovieId] = useState('');
  const [reparto, setReparto] = useState([]);
  const [personId, setPersonId] = useState('');
  const [rol, setRol] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api('/movies').then((r) => setPeliculas(Array.isArray(r) ? r : [])).catch((e) => setError(e.message));
    api('/persons').then((r) => setPersonas(Array.isArray(r) ? r : [])).catch((e) => setError(e.message));
  }, []);

  const cargar = useCallback(async (id) => {
    if (!id) return setReparto([]);
    setCargando(true); setError('');
    try { const m = await api(`/movies/${id}`); setReparto(m.people ?? m.persons ?? []); }
    catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(movieId); }, [movieId, cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/movies/${movieId}/cast`, { method: 'POST', body: JSON.stringify({ personId: Number(personId), role: rol.trim() }) });
      setPersonId(''); setRol('');
      cargar(movieId);
    } catch (err) { setError(err.message); }
  };

  const quitar = async (p) => {
    if (!window.confirm(`¿Quitar a ${p.fullName} del reparto?`)) return;
    try { await api(`/movies/${movieId}/cast/${p.id}`, { method: 'DELETE' }); cargar(movieId); }
    catch (err) { setError(err.message); }
  };

  const ocupados = new Set(reparto.map((p) => p.id));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight">Reparto por película</h1>

      <div>
        <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Película</label>
        <select className={inputCls} value={movieId} onChange={(e) => setMovieId(e.target.value)}>
          <option value="">Seleccionar...</option>
          {peliculas.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {movieId && (
        <>
          <form onSubmit={agregar} className="bg-[#121318] border border-neutral-800/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Persona</label>
              <select required className={inputCls} value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {personas.filter((p) => !ocupados.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">Rol</label>
              <input required className={inputCls} value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Ej. Paul Atreides, Director..." />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold uppercase tracking-wider">
              <Plus size={14} /> Agregar
            </button>
          </form>

          <div className="bg-[#121318] border border-neutral-800/80 rounded-xl divide-y divide-neutral-800/60">
            {cargando ? <p className="p-6 text-center text-gray-400">Cargando...</p>
              : reparto.length === 0 ? <p className="p-6 text-center text-gray-500">Esta película no tiene reparto.</p>
              : reparto.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-12 rounded overflow-hidden bg-neutral-900 flex items-center justify-center flex-shrink-0 text-neutral-600">
                    {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.fullName}</p>
                    <p className="text-xs text-purple-300 truncate">{p.movieCast?.role}</p>
                  </div>
                  <button onClick={() => quitar(p)} className="p-2 text-gray-400 hover:text-red-400" aria-label="Quitar"><Trash2 size={15} /></button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
