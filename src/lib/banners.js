import { api } from '@/lib/api';
import { lista } from '@/lib/adapters';

// Solo rutas internas o https (nunca javascript:)
export const enlaceSeguro = (u) => (typeof u === 'string' && /^(\/(?!\/)|https:\/\/)/.test(u) ? u : null);

export async function obtenerBanners() {
  return lista(await api('/banners')).map((b) => ({
    id: String(b.id),
    title: b.title,
    subtitle: b.subtitle ?? '',
    image: b.imageUrl,
    link: enlaceSeguro(b.linkUrl),
    button: b.buttonText || 'Ver más',
  }));
}
