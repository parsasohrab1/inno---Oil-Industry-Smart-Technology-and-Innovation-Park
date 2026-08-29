/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'system-ui', 'sans-serif'],
        display: ['"Aref Ruqaa"', 'Vazirmatn', 'serif'],
      },
      colors: {
        // پالت صنعتی نفت — سبز نفتی / طلایی / کربنی
        petro: {
          50: '#eefbf3',
          100: '#d6f5e2',
          200: '#b0e9c9',
          300: '#7bd6a8',
          400: '#43bb82',
          500: '#1f9e66',
          600: '#127f52',
          700: '#0f6543',
          800: '#0f5038',
          900: '#0d4230',
          950: '#05251b',
        },
        oil: {
          gold: '#d4a24e',
          amber: '#e0912f',
          rust: '#b4531f',
        },
        ink: {
          900: '#0b1220',
          800: '#111a2e',
          700: '#1b2740',
          600: '#2a3a5c',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.1)',
        glow: '0 0 0 1px rgba(31,158,102,0.15), 0 8px 24px rgba(31,158,102,0.12)',
      },
    },
  },
  plugins: [],
}
