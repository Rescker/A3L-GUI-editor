/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          lighter: '#0f3460',
        },
        accent: {
          DEFAULT: '#e94560',
          blue: '#533483',
          cyan: '#00b4d8',
          purple: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
}
