/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // shadcn HSL vars (kept for primary/secondary/etc.)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },

        // Merlin design-token families (mirror ether-web-v1 class vocabulary)
        brand: {
          50: '#f6f1fa', 100: '#e1d3f0', 200: '#bc9fd3', 300: '#a074b7',
          400: '#6e3785', 500: '#5d2f70', 600: '#4c285b', 700: '#3b1f46', 800: '#2a1731', 900: '#231428',
        },
        bg: { 'white-0': '#ffffff', 'weak-50': '#f7f7f7', 'soft-50': '#fafafa', 'soft-200': '#ebebeb' },
        text: { 'strong-950': '#171717', 'sub-600': '#5c5c5c', 'soft-400': '#a3a3a3', 'disabled-300': '#d1d1d1' },
        icon: { 'strong-950': '#171717', 'sub-600': '#5c5c5c', 'soft-400': '#a3a3a3' },
        stroke: { 'soft-200': '#ebebeb', 'sub-300': '#d1d1d1', 'strong-950': '#171717' },
        state: {
          'information-base': '#5d2f70', 'information-light': '#e1d3f0', 'information-lighter': '#f6f1fa', 'information-dark': '#1b101e',
          'warning-base': '#fa7319', 'warning-light': '#ffd9c0', 'warning-lighter': '#fff3eb', 'warning-dark': '#71330a',
          'error-base': '#fb3748', 'error-light': '#ffc0c5', 'error-lighter': '#ffebec', 'error-dark': '#681219',
          'success-base': '#1fc16b', 'success-light': '#c2f5da', 'success-lighter': '#e0faec', 'success-dark': '#0b4627',
          'blue-base': '#3559e9', 'blue-light': '#c2d6ff', 'blue-lighter': '#ebf1ff', 'blue-dark': '#122368',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
