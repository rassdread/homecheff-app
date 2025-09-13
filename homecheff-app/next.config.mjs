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
  outputFileTracingRoot: '.',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // Aggressive webpack config to completely block LightningCSS
  webpack: (config, { isServer }) => {
    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Completely exclude problematic packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'lightningcss': false,
      '@tailwindcss/node': false,
      '@tailwindcss/postcss': false,
      'lightningcss/linux-x64-gnu': false,
      'lightningcss/linux-x64-gnu.node': false,
      'lightningcss/darwin-x64': false,
      'lightningcss/darwin-x64.node': false,
      'lightningcss/win32-x64': false,
      'lightningcss/win32-x64.node': false,
    };

    // Exclude from server-side builds
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        'lightningcss',
        '@tailwindcss/node',
        '@tailwindcss/postcss',
        'lightningcss/linux-x64-gnu',
        'lightningcss/linux-x64-gnu.node',
        'lightningcss/darwin-x64',
        'lightningcss/darwin-x64.node',
        'lightningcss/win32-x64',
        'lightningcss/win32-x64.node'
      );
    }

    // Block all .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });

    // Block problematic packages completely
    config.module.rules.push({
      test: /node_modules\/(lightningcss|@tailwindcss)/,
      use: 'null-loader',
    });

    // Additional rule to catch any LightningCSS imports
    config.module.rules.push({
      test: /lightningcss/,
      use: 'null-loader',
    });

    return config;
  },
};
export default nextConfig;
