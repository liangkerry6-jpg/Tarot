/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkSpace: '#0b0c10',
        mysticPurple: '#1f2833',
        goldAura: '#c5a059',
      },
      boxShadow: {
        'gold': '0 0 30px rgba(197, 160, 89, 0.5)',
        'gold-intense': '0 0 60px rgba(197, 160, 89, 0.7)',
        'purple-glow': '0 0 40px rgba(31, 40, 51, 0.8)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'fog-drift': 'fogDrift 20s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 30px rgba(197, 160, 89, 0.5)' },
          '50%': { opacity: '1', boxShadow: '0 0 60px rgba(197, 160, 89, 0.8)' },
        },
        fogDrift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
