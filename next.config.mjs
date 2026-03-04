/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Explicitly disable Turbopack
    enabled: false,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://smartanbackend.duckdns.org/api/:path*',
      },
    ];
  },

  webpack(config) {
    return config;
  },
};

export default nextConfig;
