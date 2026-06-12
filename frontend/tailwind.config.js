/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero':   'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 72%, #4c1d95 100%)',
        'gradient-header': 'linear-gradient(to right, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        'gradient-cta':    'linear-gradient(135deg, #312e81 0%, #4c1d95 55%, #5b21b6 100%)',
        'gradient-btn':    'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
        'gradient-card':   'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-md':   '0 4px 16px -2px rgb(79 70 229 / 0.10), 0 2px 8px -2px rgb(0 0 0 / 0.06)',
        'card-lg':   '0 8px 32px -4px rgb(79 70 229 / 0.16), 0 4px 16px -4px rgb(0 0 0 / 0.08)',
        'btn':       '0 2px 8px 0 rgb(79 70 229 / 0.30)',
        'btn-hover': '0 4px 16px 0 rgb(79 70 229 / 0.40)',
        'glow':      '0 0 32px 0 rgb(99 102 241 / 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
