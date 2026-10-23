export default function SeatLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-neutral-800/60 text-xs text-neutral-400 w-full">
      <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-t-sm bg-neutral-700/80" />Disponible</span>
      <span className="flex items-center gap-2 text-white font-medium"><i className="w-4 h-4 rounded-t-sm bg-gradient-to-tr from-purple-600 to-fuchsia-500" />Seleccionado</span>
      <span className="flex items-center gap-2"><i className="w-4 h-4 rounded-t-sm bg-neutral-900 opacity-40 border border-neutral-800" />Ocupado</span>
    </div>
  );
}