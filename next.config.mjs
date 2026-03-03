/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['http://172.24.75.90:3000'],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 3000,
        aggregateTimeout: 500,
      }
    }
    return config
  },
};

export default nextConfig;
