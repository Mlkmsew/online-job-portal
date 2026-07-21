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
        primary: {
          DEFAULT: '#0F9D58',
          50: '#E6F5EC',
          100: '#CCECD9',
          200: '#99D8B3',
          300: '#66C58D',
          400: '#33B168',
          500: '#0F9D58',
          600: '#0C7D46',
          700: '#095E35',
          800: '#063F23',
          900: '#031F12',
        },
        secondary: {
          DEFAULT: '#F4B400',
          50: '#FEF8E6',
          100: '#FDF0CC',
          200: '#FBE199',
          300: '#F9D366',
          400: '#F6C333',
          500: '#F4B400',
          600: '#C39000',
          700: '#926C00',
          800: '#614800',
          900: '#312400',
        },
        accent: '#DB4437',
        success: '#0F9D58',
        danger: '#DB4437',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
