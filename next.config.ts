
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yggjwqbwhapjngewnzvg.supabase.co', // Your Supabase project hostname
        port: '',
        pathname: '/storage/v1/object/public/**', // Standard path for Supabase public storage
      },
      { // Added for the error encountered
        protocol: 'https',
        hostname: 'fonts.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
