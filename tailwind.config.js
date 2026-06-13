/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Deep space navy — primary background
        space: {
          950: '#07090f',
          900: '#0d1117',
          800: '#161b27',
          700: '#1e2638',
        },
        // Electric indigo — primary accent
        beam: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        // Cyan pulse — secondary accent for progress/success
        pulse: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        // Slate for text hierarchy
        ink: {
          100: '#f1f5f9',
          300: '#94a3b8',
          500: '#475569',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
