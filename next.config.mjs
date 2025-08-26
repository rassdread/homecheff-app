/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Laat de build slagen, ook als er ESLint fouten zijn
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
