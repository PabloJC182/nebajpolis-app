'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { EP } from '@/lib/endpoints';
import { lista } from '@/lib/adapters';

function Estrellas({ valor, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} estrellas`}
          className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}>
          <Star size={size} className={n <= valor ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ movieId }) {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(() => {
    api(EP.reviews(movieId)).then((r) => setResenas(lista(r))).catch((e) => setError(e.message)).finally(() => setCargando(false));
  }, [movieId]);

  useEffect(() => {
    try { if (localStorage.getItem('token')) setUsuario(JSON.parse(localStorage.getItem('usuario') || 'null')); } catch {}
    cargar();
  }, [cargar]);

  const mia = usuario ? resenas.find((r) => r.userId === usuario.id) : null;
  const promedio = resenas.length ? resenas.reduce((s, r) => s + r.rating, 0) / resenas.length : 0;

  const empezarEdicion = (r) => { setEditandoId(r.id); setRating(r.rating); setComentario(r.comment ?? ''); };
  const cancelar = () => { setEditandoId(null); setRating(0); setComentario(''); };

  const enviar = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Elige una calificación de 1 a 5 estrellas.');
    setEnviando(true); setError('');
    try {
      if (editandoId) await api(`/reviews/update/${editandoId}`, { method: 'PUT', body: JSON.stringify({ rating, comment: comentario }) });
      else await api('/reviews/create/', { method: 'POST', body: JSON.stringify({ movieId: Number(movieId), rating, comment: comentario }) });
      cancelar();
      cargar();
    } catch (err) { setError(err.message); }
    finally { setEnviando(false); }
  };

  const borrar = async (r) => {
    if (!window.confirm('¿Eliminar tu reseña?')) return;
    try { await api(`/reviews/delete/${r.id}`, { method: 'DELETE' }); cargar(); } catch (err) { setError(err.message); }
  };

  const mostrarForm = usuario && (!mia || editandoId);
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Reseñas ({resenas.length})</h2>
        {resenas.length > 0 && (
          <div className="flex items-center gap-2">
            <Estrellas valor={Math.round(promedio)} />
            <span className="text-sm font-bold">{promedio.toFixed(1)}</span>
          </div>
        )}
      </div>

      {mostrarForm ? (
        <form onSubmit={enviar} className="bg-[#121318]/90 border border-neutral-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">{editandoId ? 'Editar tu reseña' : 'Deja tu reseña'}</p>
          <Estrellas valor={rating} onChange={setRating} size={24} />
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} maxLength={1000} placeholder="¿Qué te pareció? (opcional)"
            className="w-full bg-[#0D0E12] border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
          <div className="flex gap-3">
            {editandoId && <button type="button" onClick={cancelar} className="px-4 py-2 rounded-lg border border-neutral-700 text-xs font-bold uppercase tracking-wider">Cancelar</button>}
            <button disabled={enviando} className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold uppercase tracking-wider disabled:opacity-50">{enviando ? 'Enviando...' : 'Publicar'}</button>
          </div>
        </form>
      ) : !usuario && (
        <p className="text-sm text-gray-400"><Link href={`/login?next=/pelicula/${movieId}`} className="text-purple-300 hover:text-white font-semibold">Inicia sesión</Link> para dejar tu reseña.</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {cargando ? <p className="text-sm text-gray-500">Cargando...</p>
        : resenas.length === 0 ? <p className="text-sm text-gray-500">Aún no hay reseñas. ¡Sé el primero!</p>
        : (
          <div className="space-y-3">
            {resenas.map((r) => (
              <article key={r.id} className="bg-[#121318]/90 border border-neutral-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center text-xs font-black flex-shrink-0">
                      {(r.appUser?.fullName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.appUser?.fullName ?? 'Usuario'}{usuario && r.userId === usuario.id && <span className="ml-2 text-[10px] text-purple-300">(tú)</span>}</p>
                      <p className="text-[11px] text-neutral-500">{new Date(r.reviewDate).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <Estrellas valor={r.rating} size={14} />
                </div>
                {r.comment && <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{r.comment}</p>}
                {usuario && (r.userId === usuario.id || usuario.role === 'admin') && (
                  <div className="flex gap-1 justify-end">
                    {r.userId === usuario.id && <button onClick={() => empezarEdicion(r)} className="p-1.5 text-gray-400 hover:text-white" aria-label="Editar"><Pencil size={14} /></button>}
                    <button onClick={() => borrar(r)} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Eliminar"><Trash2 size={14} /></button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
    </section>
  );
}
