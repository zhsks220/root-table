/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Supabase 브랜드 색상
        supabase: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#3ECF8E', // Supabase 메인 색상
          600: '#22c55e',
          700: '#16a34a',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // 주요 색상 alias
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#3ECF8E',
          600: '#22c55e',
          700: '#16a34a',
          800: '#166534',
          900: '#14532d',
        },
      },
    },
  },
  plugins: [],
}
