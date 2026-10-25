/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF9F0',
        surface: '#FAF9F0',
        'surface-cream': '#FAF9F0',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#d4fde4',
        'surface-container': '#cff7de',
        'surface-container-high': '#c9f2d9',
        'surface-container-highest': '#c4ecd3',
        'surface-dim': '#bbe3cb',
        'surface-bright': '#e8ffef',
        'surface-tint': '#2e6a41',
        primary: '#003b1b',
        'primary-container': '#14532d',
        'primary-action': '#21864A',
        'on-primary': '#ffffff',
        'on-primary-container': '#87c695',
        'primary-fixed': '#b1f2be',
        'primary-fixed-dim': '#96d5a3',
        secondary: '#6a5f00',
        'secondary-container': '#f8e136',
        'secondary-fixed': '#fbe439',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#6f6300',
        'butter-yellow': '#FFE83D',
        'pale-yellow': '#FFF7BF',
        tertiary: '#293528',
        'tertiary-container': '#404c3e',
        'on-surface': '#002113',
        'on-surface-variant': '#404941',
        outline: '#717970',
        'outline-variant': '#c0c9be',
        'border-subtle': '#E1E3D5',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff'
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        currency: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      borderRadius: {
        'card': '20px',
        'btn': '14px',
        'input': '14px',
        '2xl': '20px'
      },
      boxShadow: {
        'forest-ambient': '0 4px 14px rgba(20, 83, 45, 0.06)',
        'forest-modal': '0 20px 48px -8px rgba(20, 83, 45, 0.22), 0 8px 18px rgba(0, 0, 0, 0.08)',
        'subtle-card': '0 2px 8px rgba(20, 83, 45, 0.04)'
      }
    },
  },
  plugins: [],
}
