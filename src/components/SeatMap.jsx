'use client';

import { useMemo } from 'react';
import Seat from './Seat';
import SeatLegend from './SeatLegend';

export default function SeatMap({ seats, selectedSeatIds, onToggleSeat }) {
  // Filas y asientos tomados de la API, no fijos
  const filas = useMemo(() => {
    const mapa = {};
    seats.forEach((s) => (mapa[s.row] ??= []).push(s));
    return Object.keys(mapa)
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
      .map((row) => [row, mapa[row].sort((a, b) => a.number - b.number)]);
  }, [seats]);

  const bloque = (lista) => (
    <div className="flex gap-1 sm:gap-1.5">
      {lista.map((seat) => (
        <Seat
          key={seat.id}
          seat={seat}
          isSelected={selectedSeatIds.includes(seat.id)}
          onToggle={onToggleSeat}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* Pantalla Trapezoidal */}
      <div className="w-full max-w-xl mb-10 flex flex-col items-center">
        <div
          className="w-4/5 h-9 bg-gradient-to-b from-neutral-600 via-neutral-800 to-transparent rounded-t-lg opacity-70 shadow-[0_15px_30px_rgba(168,85,247,0.15)] flex items-center justify-center border-t border-neutral-500/30"
          style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}
        >
          <span className="text-[11px] tracking-[0.3em] font-bold text-neutral-300 uppercase">Pantalla</span>
        </div>
        <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent blur-sm mt-1" />
      </div>

      {filas.length === 0 ? (
        <p className="text-sm text-gray-500 py-10">Esta sala no tiene asientos registrados.</p>
      ) : (
        <div className="overflow-x-auto w-full flex justify-center pb-4">
          <div className="flex flex-col gap-2 min-w-max">
            {filas.map(([row, lista]) => {
              // Pasillos: bloque izquierdo / centro / derecho según los asientos reales de la fila
              const lado = Math.min(Math.ceil(lista.length / 4), Math.floor(lista.length / 2));
              return (
                <div key={row} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-5 text-xs font-mono text-neutral-500 text-right font-bold">{row}</span>
                  {bloque(lista.slice(0, lado))}
                  <div className="mx-2 sm:mx-3">{bloque(lista.slice(lado, lista.length - lado))}</div>
                  {bloque(lista.slice(lista.length - lado))}
                  <span className="w-5 text-xs font-mono text-neutral-500 text-left font-bold">{row}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SeatLegend />
    </div>
  );
}