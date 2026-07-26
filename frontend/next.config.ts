import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/static/:path*',
          destination: 'http://127.0.0.1:8000/api/static/:path*'
        },
        {
          source: '/api/live/:path*',
          destination: 'http://127.0.0.1:8000/api/live/:path*'
        },
        {
          source: '/api/picq/:path*',
          destination: 'http://127.0.0.1:8000/api/picq/:path*'
        },
        {
          source: '/api/analytics/:path*',
          destination: 'http://127.0.0.1:8000/api/analytics/:path*'
        },
        {
          source: '/api/map/:path*',
          destination: 'http://127.0.0.1:8000/api/map/:path*'
        },
        {
          source: '/api/export/:path*',
          destination: 'http://127.0.0.1:8000/api/export/:path*'
        },
        {
          source: '/api/datasource/:path*',
          destination: 'http://127.0.0.1:8000/api/datasource/:path*'
        },
        {
          source: '/api/search/:path*',
          destination: 'http://127.0.0.1:8000/api/search/:path*'
        },
        {
          source: '/api/search',
          destination: 'http://127.0.0.1:8000/api/search'
        }
      ],
      afterFiles: [],
      fallback: []
    }
  }
};

export default nextConfig;
