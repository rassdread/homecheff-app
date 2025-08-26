// eslint.config.mjs
import next from 'eslint-config-next';

export default [
  // gebruik de standaard Next.js ESLint rules
  ...next,

  // onze eigen overrides
  {
    rules: {
      // Zet deze regel uit zodat "any" geen build errors meer geeft
      '@typescript-eslint/no-explicit-any': 'off',

      // (optioneel) je kunt hier meer regels aanpassen indien nodig
      // bv: 'react/no-unescaped-entities': 'off'
    },
  },
];
