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
          light: '#F9FAFB',
          dark: '#111827'
        },
        card: {
          light: '#FFFFFF',
          dark: '#1F2937'
        },
        primary: {
          DEFAULT: '#10B981', // Emerald
          hover: '#059669'
        },
        secondary: {
          DEFAULT: '#6EE7B7', // Mint
          hover: '#34D399'
        },
        accent: {
          DEFAULT: '#22D3EE', // Cyan
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
