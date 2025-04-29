/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        darkGreen: '#64943e',
        lightGreen: '#96bf47',
        black: '#000000',
        white: '#FFFFFF',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};