/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), surface2: v('surface-2'), line: v('border'),
        fg: v('fg'), muted: v('muted'),
        navy: { DEFAULT: v('navy'), hover: v('navy-hover'), soft: v('navy-soft'), on: v('on-navy') },
        ok: { DEFAULT: v('green'), soft: v('green-soft') },
        bad: { DEFAULT: v('red'), soft: v('red-soft') },
        warn: { DEFAULT: v('amber'), soft: v('amber-soft') },
        header: { DEFAULT: v('header'), on: v('on-header'), muted: v('header-muted') },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
