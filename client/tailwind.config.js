/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#7dd8ad',
          400: '#48be89',
          500: '#25a36e',
          600: '#178459',
          700: '#136849',
          900: '#104432',
        },
      },
    },
  },
  plugins: [],
}