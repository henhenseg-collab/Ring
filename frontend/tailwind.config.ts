import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        recall: {
          purple: '#534AB7',
          violet: '#7F77DD',
          lavender: '#EEEDFE',
          dark: '#2C2C2A',
          light: '#F1EFE8',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'flip-in': {
          '0%': { transform: 'rotateY(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'flip-out': {
          '0%': { transform: 'rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'rotateY(90deg)', opacity: '0' },
        },
      },
      animation: {
        'flip-in': 'flip-in 0.3s ease-out',
        'flip-out': 'flip-out 0.3s ease-in',
      },
    },
  },
  plugins: [],
} satisfies Config
