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
  // Fix LightningCSS compatibility issue on Vercel
  webpack: (config, { isServer, dev }) => {
    // Handle LightningCSS module resolution issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Externalize problematic native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'lightningcss': 'commonjs lightningcss',
        'lightningcss/linux-x64-gnu': 'commonjs lightningcss/linux-x64-gnu',
        'lightningcss/linux-x64-gnu.node': 'commonjs lightningcss/linux-x64-gnu.node',
      });
    }

    // Ignore LightningCSS native binaries during build
    config.module.rules.push({
      test: /lightningcss\.(linux-x64-gnu\.node|darwin-x64\.node|win32-x64\.node)$/,
      use: 'null-loader',
    });

    return config;
  },
};
export default nextConfig;
