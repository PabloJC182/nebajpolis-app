import { Suspense } from 'react';
import CarteleraClient from './CarteleraClient';

export const metadata = { title: 'Cartelera | Nebajpolis' };

export default function CarteleraPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-gray-400">Cargando cartelera...</div>}>
      <CarteleraClient />
    </Suspense>
  );
}
