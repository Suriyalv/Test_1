/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official/branding navy — used only for the header strip & footer chrome.
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
        },
        // Primary vibrant brand color for every interactive module (chat, flashcards,
        // kahoot, mindmap, tests). A brighter, more saturated blue than the official
        // navy, so it still reads as energetic/teen-friendly while staying blue.
        brand: {
          50: '#eff9ff',
          100: '#dcf3ff',
          200: '#b6e6ff',
          300: '#7fd3ff',
          400: '#3ebeff',
          500: '#0ba5ec',
          600: '#0284c7',
          700: '#026aa2',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
        // Baloo 2 — rounded, bubbly display face for headings/titles/badges (teen energy).
        display: ['"Baloo 2"', '"Plus Jakarta Sans"', '"Mukta Malar"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Mukta Malar"', 'sans-serif'],
        // Ark's chat bubble — Fredoka is round and friendly; Tamil letters fall
        // through to Baloo Thambi 2, which has the same rounded feel.
        ark: ['Fredoka', '"Baloo Thambi 2"', '"Noto Sans Tamil"', 'sans-serif'],
      },
      boxShadow: {
        pop: '0 8px 24px -6px rgba(2, 132, 199, 0.35)',
        'pop-lg': '0 16px 40px -8px rgba(2, 132, 199, 0.4)',
      },
      keyframes: {
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.4s ease-in-out',
        'pop-in': 'pop-in 0.25s ease-out',
        'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
