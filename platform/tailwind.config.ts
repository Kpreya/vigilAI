import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'paper-bg': '#fcfcfc',
        'paper-off-white': '#f3f4f6',
        'border-dark': '#000000',
        'terminal-green': '#16a34a',
        'terminal-red': '#dc2626',
        'terminal-yellow': '#ca8a04',
        'terminal-grey': '#4b5563',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
      },
    },
  },
  plugins: [],
};

export default config;