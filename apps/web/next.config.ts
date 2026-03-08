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
};

export default nextConfig;
