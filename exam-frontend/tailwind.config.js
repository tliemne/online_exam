/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          950: '#050508',
          900: '#0a0a10',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222f',
          500: '#2d2d3e',
        },
        accent: {
          DEFAULT: '#7c6aff',
          hover: '#9a8bff',
          dim: '#7c6aff22',
          glow: '#7c6aff44',
        },
        cyan: {
          accent: '#00d4ff',
          dim: '#00d4ff22',
        },
        green: {
          accent: '#00e5a0',
          dim: '#00e5a022',
        },
        amber: {
          accent: '#ffb800',
          dim: '#ffb80022',
        },
        red: {
          accent: '#ff4d6a',
          dim: '#ff4d6a22',
        },
        text: {
          primary: '#f0f0fa',
          secondary: '#9090b0',
          muted: '#555570',
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(124,106,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,255,0.04) 1px, transparent 1px)',
        'glow-accent': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,106,255,0.15), transparent)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(124,106,255,0.2)',
        'glow-md': '0 0 40px rgba(124,106,255,0.3)',
        'glow-lg': '0 0 80px rgba(124,106,255,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 20px rgba(124,106,255,0.2)' }, '50%': { boxShadow: '0 0 40px rgba(124,106,255,0.5)' } },
      }
    }
  },
  plugins: []
}
