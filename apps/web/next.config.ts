import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'places.googleapis.com' },
      { protocol: 'https', hostname: 'cf.bstatic.com' },
      { protocol: 'https', hostname: 'media.expedia.com' },
      { protocol: 'https', hostname: 'media.tripadvisor.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_PLACES_KEY: process.env['GOOGLE_PLACES_API_KEY'] ?? '',
  },
};

export default nextConfig;
