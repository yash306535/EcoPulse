import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Flat ESLint config for the EcoPulse monorepo.
 * - Server / shared / tests run in Node (ESM).
 * - Client runs in the browser with React + JSX.
 */
export default [
  {
    ignores: ["client/dist/**", "**/node_modules/**", "coverage/**"],
  },
  js.configs.recommended,

  // Server, shared module, and tests — Node environment.
  {
    files: ["server/**/*.js", "shared/**/*.js", "tests/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },

  // React client — browser environment.
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // not needed with the modern JSX transform
      "react/prop-types": "off", // props are documented via JSDoc instead
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
