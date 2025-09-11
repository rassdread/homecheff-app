/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  // Remove any potential document configuration
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};
export default nextConfig;
