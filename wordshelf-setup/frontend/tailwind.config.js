/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── WordShelf Brand Palette ──
        sage: {
          50:  '#f0f7f3',
          100: '#eaf3ee',
          200: '#c4ddd0',
          300: '#a8c9b5',
          400: '#7bae8f',  // primary
          500: '#4e8c6a',  // dark
          600: '#3d6e53',
          700: '#2d5240',
          800: '#1e3629',
          900: '#0f1a14',
        },
        terra: {
          50:  '#fdf5f2',
          100: '#faf0eb',
          200: '#edb49e',
          300: '#e8a990',
          400: '#d4856a',  // primary
          500: '#a85f47',  // dark
          600: '#844a37',
          700: '#623628',
          800: '#40231a',
          900: '#20110d',
        },
        lavender: {
          50:  '#f5f3fb',
          100: '#f0ecfa',
          200: '#d4ccea',
          300: '#c5b8e2',
          400: '#b8a9d9',  // primary
          500: '#7c68b0',  // dark
          600: '#614f8a',
          700: '#483a67',
          800: '#302644',
          900: '#181322',
        },
        cream: {
          50:  '#fffdf7',
          100: '#faf7f2',
          200: '#f3efe8',
          300: '#e8e3d8',
          400: '#d4ccbc',
          500: '#b8ae9c',
        },
        navy: {
          DEFAULT: '#1c1c27',
          light:   '#252534',
          lighter: '#2d2d4e',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '28px',
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(44, 44, 58, 0.07)',
        'card-hover': '0 12px 40px rgba(44, 44, 58, 0.13)',
        'card-dark':  '0 4px 24px rgba(0, 0, 0, 0.25)',
        'sage':       '0 4px 16px rgba(123, 174, 143, 0.3)',
        'terra':      '0 4px 16px rgba(212, 133, 106, 0.3)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease both',
        'float':      'float 6s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s infinite',
        'spin-slow':  'spin 12s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.8)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
