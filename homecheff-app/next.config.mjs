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
  serverExternalPackages: ['@prisma/client'],
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // Simplified webpack config to handle LightningCSS issues
  webpack: (config, { isServer }) => {
    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Exclude problematic packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'lightningcss': false,
      '@tailwindcss/node': false,
      '@tailwindcss/postcss': false,
    };

    // Exclude from server-side builds
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('lightningcss', '@tailwindcss/node', '@tailwindcss/postcss');
    }

    // Block all .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });

    return config;
  },
};
export default nextConfig;
