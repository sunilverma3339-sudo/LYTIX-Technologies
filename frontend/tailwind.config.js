/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#F8FAFC",
        panel: "rgba(255, 255, 255, 0.92)",
        line: "#E2E8F0",
        mint: "#2563EB",
        amber: "#6366F1",
        rose: "#DC2626",
        ice: "#EEF4FF",
      },
      boxShadow: {
        glass: "0 24px 70px rgba(37, 99, 235, 0.12)",
      },
    },
  },
  plugins: [],
};
