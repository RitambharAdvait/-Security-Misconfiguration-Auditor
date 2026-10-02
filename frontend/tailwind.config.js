/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        cyber: {
          950: '#04090d', // Deepest cyber void
          900: '#071219', // Main dark canvas
          850: '#0b1922', // Card background
          800: '#10222e', // Elevated panel
          750: '#152c3c', // Interactive component
          700: '#1b374b', // Borders & dividers
          600: '#254b66',
          500: '#34668a',
          400: '#528cb5',
          300: '#8bb8d9',
          200: '#c2ddf0',
          100: '#e5f2fa',
        },
        neon: {
          green: '#00ff9d', // Electric cyber green
          emerald: '#10b981', // Solid security emerald
          mint: '#34d399',
          dark: '#054e38',
          glow: 'rgba(0, 255, 157, 0.45)',
        },
        navy: {
          950: '#081422',
          900: '#0c1f35',
          850: '#102641',
          800: '#152e4c',
          700: '#1c3e66',
          600: '#26548a',
          500: '#3371b8',
          100: '#e1ecf7',
          50: '#f0f6fc',
        },
        teal: {
          950: '#032527',
          900: '#064245',
          800: '#0a5b5f',
          700: '#0e767b',
          600: '#0f9399',
          500: '#12abb1',
          400: '#22c5cb',
          300: '#53dbe0',
          200: '#99f1f4',
          100: '#d1fafb',
          50: '#f0fdfd',
        },
        enterprise: {
          slate: '#071219',
          surface: '#0b1922',
          border: '#1b374b',
          muted: '#8bb8d9',
          primary: '#00ff9d',
          navy: '#152e4c',
          success: '#00ff9d',
          danger: '#f43f5e',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
