export default {
  plugins: {
    tailwindcss: {
      // Explicitly disable LightningCSS
      experimental: {
        optimizeUniversalDefaults: false,
      },
    },
    autoprefixer: {},
  },
};
