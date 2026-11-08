/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/{App,main}.tsx',
    './src/renderer/app/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#22c55e',
        'primary-dark': '#16a34a',
      },
    },
  },
  plugins: [],
};
