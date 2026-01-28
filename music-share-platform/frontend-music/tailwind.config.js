/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // md를 1033px로 올려서 iPad Pro 13인치 M4 세로(1032px)도 모바일 레이아웃 사용
        'md': '1033px',
        // 커스텀 브레이크포인트: 2560px 이상 (27인치 QHD, 4K 등)
        '3xl': '2560px',
      },
      keyframes: {
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.15s ease-out',
      },
      colors: {
        // 주요 색상 - Blue 계열 (디자인 통합)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 다크 테마 배경색
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
      },
    },
  },
  plugins: [],
}
