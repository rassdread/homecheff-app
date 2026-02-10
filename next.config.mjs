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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Use JPEG as fallback for old Safari (iPhone 7) that doesn't support WebP/AVIF
    formats: ['image/avif', 'image/webp'],
    // Old Safari fallback: Next.js will automatically serve JPEG when WebP/AVIF not supported
    minimumCacheTTL: 31536000, // 1 year cache for images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Device sizes for responsive images - optimized for mobile first
    // Fixed: Consistent sizes to prevent server/client mismatch
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for responsive images - optimized for faster loading
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable unoptimized for faster builds (Next.js will still optimize)
    unoptimized: false,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'date-fns',
      'zod',
      'zustand',
      'react-qr-code',
      'qrcode',
    ],
    // Modern bundling for better performance
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Enable static optimization
  swcMinify: true,
  
  // Compress output for better performance
  compress: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Bundle optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable compression
  compress: true,
  // Powerpack optimizations
  poweredByHeader: false,
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
      {
        source: '/i18n/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Enable prefetching for faster navigation (default is true, but explicit is better)
  // This makes Next.js automatically prefetch linked pages in the viewport
  // Can be disabled per Link with prefetch={false}
  reactStrictMode: true,
  // Simplified webpack config to handle LightningCSS issues
  webpack: (config, { isServer, dev }) => {
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

    // Optimize bundle splitting for production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
              minChunks: 1,
            },
            // Separate chunk for common code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              minSize: 0,
            },
            // Separate chunk for heavy libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // Next.js framework
            nextjs: {
              test: /[\\/]node_modules[\\/](next)[\\/]/,
              name: 'nextjs',
              chunks: 'all',
              priority: 28,
            },
            // Maps libraries
            maps: {
              test: /[\\/]node_modules[\\/](@react-google-maps|google-maps|@googlemaps)[\\/]/,
              name: 'maps',
              chunks: 'async',
              priority: 25,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }

    return config;
  },
};
export default nextConfig;
