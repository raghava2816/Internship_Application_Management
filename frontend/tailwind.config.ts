import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#f8fafc',
          dark: '#030712'
        },
        card: {
          light: '#ffffff',
          dark: '#0b0f19'
        },
        primary: {
          DEFAULT: '#6366f1', // Indigo
          hover: '#4f46e5'
        },
        secondary: {
          DEFAULT: '#06b6d4', // Cyan
          hover: '#0891b2'
        },
        accent: {
          DEFAULT: '#ec4899', // Pink
          success: '#10b981', // Emerald
          warning: '#f59e0b', // Amber
          danger: '#ef4444' // Red
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)'
      }
    },
  },
  plugins: [],
} satisfies Config;
