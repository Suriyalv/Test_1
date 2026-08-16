/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a', // Deep Navy
          950: '#0f172a', // Dark Navy / Slate
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Mukta Malar"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Mukta Malar"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
