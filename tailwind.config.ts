import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#059cc0",
          green: "#03b28c",
          gray: "#1f1f21",
          white: "#ffffff",
        },
        surface: "var(--bg-surface)",
        "surface-hover": "var(--bg-surface-hover)",
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        accent: {
          DEFAULT: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          danger: "var(--accent-danger)",
          warning: "var(--accent-warning)",
          success: "var(--accent-success)",
          info: "var(--accent-info)",
          gold: "var(--accent-gold)",
        },
        dashboard: {
          card: "var(--dashboard-card-primary)",
          "card-secondary": "var(--dashboard-card-secondary)",
          "card-hover": "var(--dashboard-card-hover)",
          border: "var(--dashboard-border)",
          "border-hover": "var(--dashboard-border-hover)",
        },
      },
      borderColor: {
        glass: "var(--glass-border)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      boxShadow: {
        glass: "var(--card-shadow)",
      },
      fontFamily: {
        sans: ["var(--font-rubik)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        swipe: "24px",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "gradient": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "blob": "blob 7s infinite",
        "gradient": "gradient 3s ease infinite",
      },
      animationDelay: {
        "2000": "2s",
        "4000": "4s",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        ".animation-delay-2000": {
          "animation-delay": "2s",
        },
        ".animation-delay-4000": {
          "animation-delay": "4s",
        },
      });
    },
  ],
};
export default config;
