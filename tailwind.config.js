/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%":   { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        progress: {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        fadeInUpSlow: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fadeInUp":       "fadeInUp 0.7s ease forwards",
        "fade-in-up":     "fadeInUpSlow 0.8s ease forwards",
        "bounce-gentle":  "bounceGentle 2s ease-in-out infinite",
        "progress":       "progress 2s ease-in-out forwards",
        "fadeInDown":     "fadeInDown 0.6s ease forwards",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(59,130,246,0.10)",
        glow: "0 0 32px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [],
}

