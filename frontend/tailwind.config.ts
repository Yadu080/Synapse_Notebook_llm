import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      colors: {
        ink: '#070B14',
        panel: '#101826',
        accent: '#7dd3fc',
        gold: '#f4c26b',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(125, 211, 252, 0.16), 0 20px 70px rgba(2, 6, 23, 0.6)',
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(125,211,252,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.07) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
