import type { NextConfig } from 'next';

// Optimize DNS resolution for local development
if (process.env.NODE_ENV === 'development') {
  // Set DNS lookup preferences to IPv4 first
  const dns = require('dns');
  dns.setDefaultResultOrder('ipv4first');

  // Reduce DNS lookup timeout
  process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '16';
}

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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
