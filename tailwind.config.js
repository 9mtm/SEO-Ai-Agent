/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,ts,jsx,tsx}',
   ],
   safelist: [
      'max-h-48',
      'w-[150px]',
      'w-[240px]',
      'min-w-[270px]',
      'min-w-[180px]',
      'max-w-[180px]',
    ],
   theme: {
     extend: {
       colors: {
         primary: {
           DEFAULT: '#1d4ed8',
           50: '#eff6ff',
           100: '#dbeafe',
           200: '#bfdbfe',
           300: '#93c5fd',
           400: '#60a5fa',
           500: '#3b82f6',
           600: '#2563eb',
           700: '#1d4ed8',
           800: '#1e40af',
           900: '#1e3a8a',
         },
       },
     },
   },
   plugins: [],
   future: {
     hoverOnlyWhenSupported: true,
   },
 };
