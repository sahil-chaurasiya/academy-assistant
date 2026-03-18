/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        ink: '#1a1a2e',
        slate: '#2d2d44',
        muted: '#6b6b8a',
        cream: '#f5f0e8',
        parchment: '#ede8dc',
        amber: '#d4820a',
        'amber-light': '#f0a830',
        emerald: '#1a6b4a',
        'emerald-light': '#22a06b',
        rose: '#c0392b',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(26,26,46,0.08), 0 1px 3px rgba(26,26,46,0.06)',
        'card-hover': '0 8px 24px rgba(26,26,46,0.12), 0 2px 8px rgba(26,26,46,0.08)',
      },
    },
  },
  plugins: [],
};
