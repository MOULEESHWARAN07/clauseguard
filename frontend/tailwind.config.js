/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e4e3ff',
          200: '#cccaff',
          300: '#a9a4ff',
          400: '#8176ff',
          500: '#6047ff',
          600: '#5035f7',
          700: '#4326e3',
          800: '#3720b9',
          900: '#301e93',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
}
