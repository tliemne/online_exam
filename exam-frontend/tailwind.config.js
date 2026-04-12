/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['attribute', 'data-theme'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Sans"', '"Inter"', 'sans-serif'],
        body:    ['"DM Sans"', '"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      colors: {
        navy: {
          900: '#0b1437', 800: '#111c44', 700: '#1b254b',
          600: '#24388a', 500: '#1b3bbb', 400: '#3652ba',
        },
        brand: { 400: '#7551ff', 500: '#422afb', 600: '#3311db' },
        surface: {
          950: 'var(--bg-page)', 900: 'var(--bg-page)',
          800: 'var(--bg-surface)', 700: 'var(--bg-elevated)',
          600: 'var(--border-base)', 500: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)', dark: 'var(--accent-dark)',
          hover: 'var(--accent-hover)', subtle: 'var(--accent-subtle)',
          border: 'var(--accent-border)',
        },
        text: {
          primary: 'var(--text-1)', secondary: 'var(--text-2)',
          muted: 'var(--text-3)', disabled: 'var(--text-4)',
        },
        success: { DEFAULT: '#01b574', subtle: 'rgba(1,181,116,0.12)', border: 'rgba(1,181,116,0.25)' },
        warning: { DEFAULT: '#ffb547', subtle: 'rgba(255,181,71,0.12)', border: 'rgba(255,181,71,0.25)' },
        danger:  { DEFAULT: '#ee5d50', subtle: 'rgba(238,93,80,0.12)', border: 'rgba(238,93,80,0.25)' },
        info:    { DEFAULT: '#3965ff', subtle: 'rgba(57,101,255,0.12)', border: 'rgba(57,101,255,0.25)' },
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)', 'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)', 'modal': 'var(--shadow-modal)',
        'focus': '0 0 0 3px var(--accent-subtle)',
        'horizon': '14px 17px 40px 4px rgba(112,144,176,0.08)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
    }
  },
  plugins: []
}