import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Travel Buddy',
    short_name: 'Travel Buddy',
    description: 'AI-powered resort decision engine that finds your perfect matches.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
