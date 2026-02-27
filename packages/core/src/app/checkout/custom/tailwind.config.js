/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        'custom': '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);',
      },
      screens: {
        '3xl': '1850px',
        '4xl': '2150px',
        '5xl': '2550px',
        '6xl': '2850px',
        '7xl': '3250px',
      },
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
//
  ],
}

