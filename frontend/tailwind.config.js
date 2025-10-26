/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    transform: {
      DEFAULT: (content) => content,
      tsx: (content) => content,
    },
  },
  experimental: {
    optimizeUniversal: true,
  },
  // You can add additional configuration options here as needed
};
