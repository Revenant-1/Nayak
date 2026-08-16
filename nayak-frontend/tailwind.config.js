/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces — cool, near-black, never pure #000
        void: '#05060B',
        panel: '#0D1020',
        'panel-hi': '#151933',
        line: '#1E2340',
        // Text
        ink: '#EEF0FA',
        mist: '#868CAA',
        // Signal accents, named after the orb's own palette
        iris: '#8B5CF6',
        magenta: '#EC4899',
        cyan: '#2DD4E8',
        jade: '#14C9A5',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'spin-slow-reverse': {
          to: { transform: 'rotate(-360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'spin-slow-reverse': 'spin-slow-reverse 24s linear infinite',
        'fade-up': 'fade-up 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
