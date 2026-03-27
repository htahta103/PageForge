/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'rgb(var(--pf-page) / <alpha-value>)',
        surface: 'rgb(var(--pf-surface) / <alpha-value>)',
        muted: 'rgb(var(--pf-muted) / <alpha-value>)',
        border: 'rgb(var(--pf-border) / <alpha-value>)',
        fg: 'rgb(var(--pf-fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--pf-fg-muted) / <alpha-value>)',
        'fg-subtle': 'rgb(var(--pf-fg-subtle) / <alpha-value>)',
        link: 'rgb(var(--pf-link) / <alpha-value>)',
        accent: 'rgb(var(--pf-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--pf-accent-hover) / <alpha-value>)',
        'on-accent': 'rgb(var(--pf-on-accent) / <alpha-value>)',
        inverse: 'rgb(var(--pf-inverse-bg) / <alpha-value>)',
        'inverse-fg': 'rgb(var(--pf-inverse-fg) / <alpha-value>)',
        danger: 'rgb(var(--pf-danger) / <alpha-value>)',
        'danger-bg': 'rgb(var(--pf-danger-bg) / <alpha-value>)',
        'danger-border': 'rgb(var(--pf-danger-border) / <alpha-value>)',
        'danger-fg': 'rgb(var(--pf-danger-fg) / <alpha-value>)',
        'selection-bg': 'rgb(var(--pf-selection-bg) / <alpha-value>)',
        'selection-border': 'rgb(var(--pf-selection-border) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
