import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite - Cà phê pha theo cách của bạn',
    short_name: 'BrewLite',
    description: 'Xem menu đồ uống BrewLite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f6ef',
    theme_color: '#355d49',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
