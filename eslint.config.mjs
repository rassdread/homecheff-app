export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "android/**",
      "next-env.d.ts"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];

