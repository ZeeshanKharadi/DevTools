import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".wrangler/**",
      "worker/.wrangler/**",
      // Vendored PDF.js worker (minified third-party bundle)
      "public/pdf.worker.min.mjs",
    ],
  },
];

export default eslintConfig;
