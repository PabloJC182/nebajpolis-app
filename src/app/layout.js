import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SesionInactiva from '@/components/SesionInactiva';

export const metadata = {
  title: 'Nebajpolis | Cartelera y boletos en línea',
  description: 'Compra tus boletos de cine en línea.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-ink text-white min-h-screen font-sans selection:bg-brand-600 relative overflow-x-hidden">
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-900/20 blur-[120px] pointer-events-none z-0 rounded-full" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-900/15 blur-[140px] pointer-events-none z-0 rounded-full" />
        <Navbar />
        {children}
        <Footer />
        <SesionInactiva />
      </body>
    </html>
  );
}
