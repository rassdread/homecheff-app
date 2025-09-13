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

    // More aggressive LightningCSS handling
    config.resolve.alias = {
      ...config.resolve.alias,
      'lightningcss': false,
      'lightningcss/linux-x64-gnu': false,
      'lightningcss/linux-x64-gnu.node': false,
      'lightningcss/darwin-x64': false,
      'lightningcss/darwin-x64.node': false,
      'lightningcss/win32-x64': false,
      'lightningcss/win32-x64.node': false,
    };

    // Externalize problematic native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'lightningcss': 'commonjs lightningcss',
        'lightningcss/linux-x64-gnu': 'commonjs lightningcss/linux-x64-gnu',
        'lightningcss/linux-x64-gnu.node': 'commonjs lightningcss/linux-x64-gnu.node',
        'lightningcss/darwin-x64': 'commonjs lightningcss/darwin-x64',
        'lightningcss/darwin-x64.node': 'commonjs lightningcss/darwin-x64.node',
        'lightningcss/win32-x64': 'commonjs lightningcss/win32-x64',
        'lightningcss/win32-x64.node': 'commonjs lightningcss/win32-x64.node',
      });
    }

    // Ignore LightningCSS native binaries during build
    config.module.rules.push({
      test: /lightningcss\.(linux-x64-gnu\.node|darwin-x64\.node|win32-x64\.node)$/,
      use: 'null-loader',
    });

    // Additional rule to handle LightningCSS modules
    config.module.rules.push({
      test: /node_modules\/lightningcss/,
      use: 'null-loader',
    });

    return config;
  },
};
export default nextConfig;
