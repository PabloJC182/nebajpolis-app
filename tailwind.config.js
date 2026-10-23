/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08090c',
        surface: '#0d0f14',
        brand: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
      },
      keyframes: { fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } },
      animation: { fadeIn: 'fadeIn 0.25s ease-out' },
    },
  },
  plugins: [],
};
