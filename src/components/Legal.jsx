// Contenedor común de las páginas legales
export default function Legal({ titulo, actualizado, children }) {
  return (
    <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16 min-h-screen">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">{titulo}</h1>
      <p className="text-xs text-gray-500 mb-8">Última actualización: {actualizado}</p>
      <div className="space-y-6 text-sm text-gray-300 leading-relaxed [&_h2]:text-base [&_h2]:font-black [&_h2]:text-white [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-purple-300 [&_a:hover]:text-white [&_a]:underline">
        {children}
      </div>
    </main>
  );
}
