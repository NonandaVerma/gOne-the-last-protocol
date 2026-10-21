/** @type {import('tailwindcss').Config} */

/**
 * G-ONE DESIGN TOKENS — "Order vs Entropy".
 *
 * Two factions, one neutral material set. There is deliberately NO third
 * accent (no gold / amber / bronze): cyan means Order/G-One, crimson means
 * Entropy/Ra-One, and anything shared or system-level is neutral steel.
 *
 * Every token mirrors a CSS custom property declared in `globals.css`, so
 * React components, raw CSS and inline styles all resolve to the same value.
 */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ---- ORDER — G-One, the Last Protocol ---- */
        order: {
          cyan: '#00CFFF',
          blue: '#278BFF',
          ice: '#E8FAFF',
          deep: '#06121F',
          dim: '#0A85B5',
          glow: 'rgba(0, 207, 255, 0.75)',
        },
        /* ---- ENTROPY — Ra-One, the corruption ---- */
        entropy: {
          crimson: '#FF243D',
          red: '#C9102B',
          hi: '#FF6678',
          dark: '#18070C',
          dim: '#8F0A1C',
          glow: 'rgba(255, 36, 61, 0.75)',
        },
        /* ---- Shared neutral materials ---- */
        graphite: '#111820',
        obsidian: '#070A0F',
        steel: '#8395A5',
        'steel-dark': '#2B3A4D',
        paper: '#EAF2F7',
        muted: '#9BAAB7',

        /* ---- Third-accent enforcement ------------------------------
         * Tailwind's stock amber/yellow/orange ramps are still referenced
         * by screens not yet migrated by hand (GameHUD, PauseMenu,
         * SettingsMenu, StoryOverlay, TouchControls, Victory/GameOver).
         * Overriding the ramps to neutral steel retires the gold third
         * accent everywhere at once instead of leaving it live until each
         * component is rewritten. Per-element cyan/crimson assignment
         * still happens during the component pass.
         * ------------------------------------------------------------ */
        amber: {
          50: '#F2F6F9', 100: '#E4EBF0', 200: '#C9D5DE', 300: '#A9BAC8',
          400: '#8395A5', 500: '#6B7D8D', 600: '#55646F', 700: '#404C55',
          800: '#2B3A4D', 900: '#1A232E', 950: '#111820',
        },
        yellow: {
          50: '#F2F6F9', 100: '#E4EBF0', 200: '#C9D5DE', 300: '#A9BAC8',
          400: '#8395A5', 500: '#6B7D8D', 600: '#55646F', 700: '#404C55',
          800: '#2B3A4D', 900: '#1A232E', 950: '#111820',
        },
        orange: {
          50: '#FFF1F3', 100: '#FFE0E4', 200: '#FFC2CA', 300: '#FF9AA8',
          400: '#FF6678', 500: '#FF243D', 600: '#C9102B', 700: '#A00D22',
          800: '#6B1020', 900: '#3D0912', 950: '#18070C',
        },

        /* ---- Legacy faction aliases ----
         * Kept so not-yet-migrated components keep compiling. */
        divine: {
          50: '#E8FAFF', 100: '#D3F3FF', 200: '#A6E7FF', 300: '#5ED8FF',
          400: '#00CFFF', 500: '#278BFF',
          cyan: '#00CFFF', celestial: '#00CFFF', blue: '#278BFF',
          deep: '#06121F', gold: '#8395A5', amber: '#E8FAFF',
          marble: '#EAF2F7', glow: 'rgba(0, 207, 255, 0.75)',
        },
        destroyer: {
          50: '#FFE9EC', 100: '#FFD2D8', 200: '#FFA7B2', 300: '#FF6678',
          400: '#FF243D', 500: '#C9102B',
          red: '#FF243D', blood: '#C9102B', crimson: '#8F0A1C',
          dark: '#18070C', iron: '#111820', rune: '#FF6678',
          molten: '#C9102B', glow: 'rgba(255, 36, 61, 0.75)',
        },
        myth: {
          obsidian: '#070A0F', stone: '#111820', border: '#2B3A4D',
          bronze: '#8395A5', silver: '#8395A5',
        },
        gone: {
          50: '#E8FAFF', 100: '#D3F3FF', 200: '#A6E7FF', 300: '#5ED8FF',
          400: '#00CFFF', 500: '#278BFF',
          cyan: '#00CFFF', blue: '#278BFF', glow: 'rgba(0, 207, 255, 0.75)',
        },
        raone: {
          50: '#FFE9EC', 100: '#FFD2D8', 200: '#FFA7B2', 300: '#FF6678',
          400: '#FF243D', 500: '#C9102B',
          red: '#FF243D', crimson: '#C9102B', dark: '#18070C',
          glow: 'rgba(255, 36, 61, 0.75)',
        },
      },

      fontFamily: {
        display: ['var(--font-orbitron)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ui: ['var(--font-rajdhani)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],

        /* Legacy aliases — remapped off the retired serif stack so existing
         * `font-cinzel` / `font-cormorant` usages immediately read sci-fi. */
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        rajdhani: ['var(--font-rajdhani)', 'sans-serif'],
        cinzelDeco: ['var(--font-orbitron)', 'sans-serif'],
        cinzel: ['var(--font-rajdhani)', 'sans-serif'],
        cormorant: ['var(--font-inter)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },

      letterSpacing: {
        protocol: '0.42em',
        system: '0.26em',
      },

      boxShadow: {
        'order-edge': '0 0 0 1px rgba(0,207,255,0.35), 0 0 24px -4px rgba(0,207,255,0.45)',
        'entropy-edge': '0 0 0 1px rgba(255,36,61,0.35), 0 0 24px -4px rgba(255,36,61,0.45)',
        'steel-edge': '0 0 0 1px rgba(131,149,165,0.28), 0 10px 40px -12px rgba(0,0,0,0.9)',
        panel: '0 24px 70px -20px rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(234,242,247,0.07)',
      },

      animation: {
        'seam-pulse': 'seamPulse 4.5s ease-in-out infinite',
        'seam-flicker': 'seamFlicker 7s steps(1, end) infinite',
        'slow-push': 'slowPush 32s ease-in-out infinite alternate',
        'drift-up': 'driftUp linear infinite',
        'core-pulse': 'corePulse 3.2s ease-in-out infinite',
        'fissure-pulse': 'fissurePulse 5s ease-in-out infinite',
        'energy-sweep': 'energySweep 1.1s ease-out',
        'fade-in': 'fadeIn 0.35s ease-out both',
        'rise-in': 'riseIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scanline': 'scanline 8s linear infinite',
      },

      keyframes: {
        seamPulse: {
          '0%, 100%': { opacity: '0.45', transform: 'scaleX(1)' },
          '50%': { opacity: '0.9', transform: 'scaleX(1.9)' },
        },
        seamFlicker: {
          '0%, 92%, 100%': { opacity: '1' },
          '94%': { opacity: '0.35' },
          '96%': { opacity: '1' },
          '98%': { opacity: '0.55' },
        },
        slowPush: {
          '0%': { transform: 'scale(1.06) translate3d(0,0,0)' },
          '100%': { transform: 'scale(1.14) translate3d(0,-1.2%,0)' },
        },
        driftUp: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0' },
          '12%': { opacity: '0.85' },
          '100%': { transform: 'translateY(-78vh) scale(0.35)', opacity: '0' },
        },
        corePulse: {
          '0%, 100%': { opacity: '0.22', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.16)' },
        },
        fissurePulse: {
          '0%, 100%': { opacity: '0.16' },
          '45%': { opacity: '0.5' },
          '55%': { opacity: '0.3' },
        },
        energySweep: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
};
