/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          bg: "#0B0E14",
          card: "#121721",
          border: "#1E293B",
          accent: "#00F0FF",
          purple: "#8B5CF6",
          emerald: "#10B981",
          rose: "#F43F5E",
          amber: "#F59E0B",
        }
      }
    },
  },
  plugins: [],
}
