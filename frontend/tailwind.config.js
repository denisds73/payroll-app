/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    transform: {
      DEFAULT: (content) => content,
      tsx: (content) => content,
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
  experimental: {
    optimizeUniversal: true,
  },
};
