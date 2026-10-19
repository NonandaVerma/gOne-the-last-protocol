/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        divine: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          cyan: '#00f0ff',
          celestial: '#38bdf8',
          blue: '#1d4ed8',
          deep: '#031738',
          gold: '#f59e0b',
          amber: '#fbbf24',
          marble: '#f8fafc',
          glow: 'rgba(56, 189, 248, 0.75)',
        },
        destroyer: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          red: '#ff0033',
          blood: '#dc2626',
          crimson: '#991b1b',
          dark: '#2d060a',
          iron: '#18181b',
          rune: '#f97316',
          molten: '#ea580c',
          glow: 'rgba(239, 68, 68, 0.75)',
        },
        myth: {
          obsidian: '#03060d',
          stone: '#0b1120',
          border: '#1e293b',
          bronze: '#d97706',
          silver: '#94a3b8',
        },
        gone: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          cyan: '#00f0ff',
          blue: '#0070f3',
          glow: 'rgba(0, 240, 255, 0.75)',
        },
        raone: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          red: '#ff0033',
          crimson: '#dc2626',
          dark: '#450a0a',
          glow: 'rgba(255, 0, 51, 0.75)',
        },
      },
      fontFamily: {
        cinzelDeco: ['var(--font-cinzel-decorative)', 'serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        orbitron: ['var(--font-cinzel)', 'serif'], // Fallback alias
        rajdhani: ['var(--font-inter)', 'sans-serif'], // Fallback alias
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'divine-shimmer': 'divineShimmer 3s ease-in-out infinite',
        'rune-flicker': 'runeFlicker 0.2s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.9', filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.8))' },
          '50%': { opacity: '0.4', filter: 'drop-shadow(0 0 5px rgba(56,189,248,0.3))' },
        },
        divineShimmer: {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.6))' },
          '50%': { filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.4))' },
        },
        runeFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
};
