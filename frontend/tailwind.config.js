/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        /* Theme surfaces */
        void: 'rgb(var(--void) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        'panel-hi': 'rgb(var(--panel-hi) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',

        /* Text */
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mist: 'rgb(var(--mist) / <alpha-value>)',

        /* Accent colors */
        iris: 'rgb(var(--iris) / <alpha-value>)',
        magenta: 'rgb(var(--magenta) / <alpha-value>)',
        cyan: 'rgb(var(--cyan) / <alpha-value>)',
        jade: 'rgb(var(--jade) / <alpha-value>)',
        orange: 'rgb(var(--orange) / <alpha-value>)',
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      keyframes: {
        breathe: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.55',
          },
          '50%': {
            transform: 'scale(1.08)',
            opacity: '0.85',
          },
        },

        'spin-slow': {
          to: {
            transform: 'rotate(360deg)',
          },
        },

        'spin-slow-reverse': {
          to: {
            transform: 'rotate(-360deg)',
          },
        },

        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(6px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },

      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'spin-slow-reverse':
          'spin-slow-reverse 24s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out',
      },
    },
  },

  plugins: [],
}
