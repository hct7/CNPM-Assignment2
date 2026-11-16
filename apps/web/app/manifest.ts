import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BrewLite - Cà phê pha theo cách của bạn',
    short_name: 'BrewLite',
    description: 'Xem menu đồ uống BrewLite.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080506',
    theme_color: '#080506',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
