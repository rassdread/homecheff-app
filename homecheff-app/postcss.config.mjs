export default {
  plugins: {
    tailwindcss: {
      // Force disable any experimental features that might use LightningCSS
      experimental: {
        optimizeUniversalDefaults: false,
      },
    },
    autoprefixer: {},
  },
};
