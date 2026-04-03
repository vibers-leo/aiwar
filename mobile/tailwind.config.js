/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00D9FF",
          light: "#33E3FF",
          dark: "#00AACC",
        },
        secondary: "#FF6B35",
        bg: "#050505",
        surface: "#111111",
        card: "#1a1a1a",
        text: {
          DEFAULT: "#f0f0f0",
          muted: "#888888",
        },
        border: "#2a2a2a",
        success: "#10b981",
        error: "#ff3366",
      },
      borderRadius: {
        'card': '24px',
        'button': '9999px',
        'modal': '32px',
      },
      fontSize: {
        'heading-1': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'heading-2': ['22px', { lineHeight: '30px', fontWeight: '700' }],
        'heading-3': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
