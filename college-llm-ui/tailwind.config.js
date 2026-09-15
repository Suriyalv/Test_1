/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minimal: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        apple: {
          blue: '#007AFF',
          blueHover: '#0062CC',
          lightBlue: '#E5F1FF',
        },
        atlas: {
          50: '#fcfaf7',
          100: '#f6f1e8',
          200: '#eee3d1',
          300: '#e3d0b2',
          400: '#d4b78a',
          500: '#c59f63',
          600: '#b4864b',
          700: '#946a3c',
          800: '#795434',
          900: '#452e1f',
          gold: '#f59e0b',
          goldDark: '#d97706',
          amber: '#fef3c7',
          teal: '#0d9488',
          cyan: '#0284c7',
          sky: '#0284c7',
          indigo: '#4f46e5',
          emerald: '#059669',
          rose: '#e11d48',
          night: '#0c1222',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Cabinet Grotesk"', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Mukta Malar"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'atlas-sm': '0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 1px 3px -1px rgba(15, 23, 42, 0.03)',
        'atlas-card': '0 10px 25px -4px rgba(15, 23, 42, 0.06), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'atlas-hover': '0 22px 45px -8px rgba(15, 23, 42, 0.12), 0 10px 25px -5px rgba(245, 158, 11, 0.18)',
        'atlas-glow': '0 0 24px -2px rgba(245, 158, 11, 0.3)',
        'atlas-cyan-glow': '0 0 24px -2px rgba(14, 165, 233, 0.3)',
        apple: '0 4px 24px -6px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'apple-sm': '0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 12px 32px -8px rgba(0, 0, 0, 0.12)',
        float: '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'float': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
