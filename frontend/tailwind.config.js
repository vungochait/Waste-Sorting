/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#22C55E',
          600: '#16A34A', // primary (nền, icon)
          700: '#15803D', // primary cho chữ/nút – đạt 4.5:1 trên nền trắng
          800: '#166534',
          900: '#14532D',
        },
        sky: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9', // secondary
          700: '#0369A1',
        },
        ink: '#1E293B',
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -8px rgba(15,23,42,0.08)',
        lift: '0 1px 2px rgba(15,23,42,0.04), 0 16px 40px -16px rgba(15,23,42,0.18)',
      },
    },
  },
  plugins: [],
}
