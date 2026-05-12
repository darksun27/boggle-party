/** @type {import('tailwindcss').Config} */
export default {
  content: ['./**/*.{html,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Fredoka', 'sans-serif'],
      },
      colors: {
        accent: '#6b21a8',
        pink: '#ff4ecb',
      },
    },
  },
  plugins: [],
};
