/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1C1917',
        'ink-soft': '#44403C',
        'ink-muted': '#78716C',
        'warm-white': '#FFFFFF',
        cream: '#FAF7F2',
        'cream-deep': '#F0EAE0',
        sand: '#E8DECE',
        blush: '#D4A5A0',
        'blush-light': '#EDD5D2',
        gold: '#B89B6E',
        'gold-light': '#D4BC96',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'serif-sc': ['"Noto Serif SC"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
