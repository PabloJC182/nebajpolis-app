'use client';

export default function Seat({ seat, isSelected, onToggle }) {
  const ocupado = seat.status === 'occupied';
  const estilo = ocupado
    ? 'bg-neutral-900/80 text-neutral-600 cursor-not-allowed opacity-40'
    : isSelected
      ? 'bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.7)] scale-105 ring-1 ring-purple-300'
      : 'bg-neutral-700/60 hover:bg-neutral-500 text-neutral-400 hover:scale-110';

  return (
    <button
      disabled={ocupado}
      onClick={() => onToggle(seat)}
      title={`Fila ${seat.row} - Asiento ${seat.number}`}
      className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-t-md rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all ${estilo}`}
    >
      {seat.number}
    </button>
  );
}