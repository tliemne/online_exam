/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['attribute', 'data-theme'],   // dùng data-theme="dark" / "light"
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          950: '#0d0f14',
          900: '#13151c',
          800: '#191c25',
          700: '#1f232e',
          600: '#272b38',
          500: '#333849',
          400: '#454c63',
        },
        accent: {
          DEFAULT: '#4f6ef7',
          hover:   '#3d5de8',
          subtle:  'rgba(79,110,247,0.12)',
          border:  'rgba(79,110,247,0.25)',
        },
        text: {
          primary:   '#e8eaf2',
          secondary: '#8b90a8',
          muted:     '#50546a',
          disabled:  '#363a4d',
        },
        success: { DEFAULT: '#16a34a', subtle: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
        warning: { DEFAULT: '#d97706', subtle: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)'   },
        danger:  { DEFAULT: '#dc2626', subtle: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)'   },
        info:    { DEFAULT: '#0891b2', subtle: 'rgba(8,145,178,0.1)',   border: 'rgba(8,145,178,0.2)'   },
      },
      boxShadow: {
        'sm':    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'md':    '0 4px 12px rgba(0,0,0,0.1)',
        'lg':    '0 8px 24px rgba(0,0,0,0.14)',
        'modal': '0 24px 64px rgba(0,0,0,0.2)',
        'focus': '0 0 0 3px rgba(79,110,247,0.2)',
        // dark overrides applied via CSS variables
        'sm-dark':    '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'modal-dark': '0 24px 64px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease forwards',
        'slide-up': 'slideUp 0.25s ease forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                               to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    }
  },
  plugins: []
}