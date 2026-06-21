/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF9F6",
        surface: "#FFFFFF",
        forest: "#2F6B4F",
        teal: "#1B7F6E",
        sand: "#D9A86C",
        charcoal: "#2B2B2B",
        slate: "#5A6B62",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(43, 43, 43, 0.06)",
        softer: "0 4px 16px rgba(43, 43, 43, 0.05)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
