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
        // CSS variable-based tokens — work in both themes
        surface: {
          950: 'var(--bg-page)',
          900: 'var(--bg-page)',
          800: 'var(--bg-surface)',
          700: 'var(--bg-elevated)',
          600: 'var(--border-base)',
          500: 'var(--border-strong)',
          400: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          subtle:  'var(--accent-subtle)',
          border:  'var(--accent-border)',
        },
        text: {
          primary:   'var(--text-1)',
          secondary: 'var(--text-2)',
          muted:     'var(--text-3)',
          disabled:  'var(--text-4)',
        },
        success: { DEFAULT: '#16a34a', subtle: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.2)'   },
        warning: { DEFAULT: '#d97706', subtle: 'rgba(217,119,6,0.1)',   border: 'rgba(217,119,6,0.2)'   },
        danger:  { DEFAULT: '#dc2626', subtle: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.2)'   },
        info:    { DEFAULT: '#0891b2', subtle: 'rgba(8,145,178,0.1)',   border: 'rgba(8,145,178,0.2)'   },
      },
      boxShadow: {
        'sm':    'var(--shadow-sm)',
        'md':    'var(--shadow-md)',
        'lg':    '0 8px 24px rgba(0,0,0,0.14)',
        'modal': 'var(--shadow-modal)',
        'focus': '0 0 0 3px var(--accent-border)',
        // kept for backward compat
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