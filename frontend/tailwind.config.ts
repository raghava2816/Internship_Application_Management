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
          DEFAULT: 'hsl(var(--background))',
          light: '#F9FAFB',
          dark: '#111827'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          light: '#FFFFFF',
          dark: '#1F2937'
        },
        primary: {
          DEFAULT: '#F97316', // Orange
          hover: '#EA580C'
        },
        secondary: {
          DEFAULT: '#FB923C', // Lighter Orange
          hover: '#F97316'
        },
        accent: {
          DEFAULT: '#F43F5E', // Rose
          success: '#10B981', // Emerald
          warning: '#F59E0B', // Amber
          danger: '#EF4444' // Red
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
