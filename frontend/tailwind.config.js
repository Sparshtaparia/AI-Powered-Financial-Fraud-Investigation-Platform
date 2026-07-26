/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        aegis: {
          base: '#080A0C',
          surface: '#101418',
          surfaceSecondary: '#151A20',
          border: 'rgba(255, 255, 255, 0.06)',
          primary: '#22C55E',
          secondary: '#84CC16',
          purple: '#9333EA', // For graph relationships
          warning: '#F97316', // For warnings
          danger: '#EF4444' // For High Risk
        }
      }
    },
  },
  plugins: [],
}
