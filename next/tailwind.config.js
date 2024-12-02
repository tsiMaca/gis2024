import { nextui } from "@nextui-org/react"

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-fast": "fadeIn 1s ease-in-out forwards",
        "fade-out-slow": "fadeOut 3s ease-in-out forwards",
        "fade-out-medium": "fadeOut 2s ease-in-out forwards",
        "fade-out-fast": "fadeOut 1s ease-in-out forwards",
        "pop-in": "popIn 0.25s ease-in-out forwards",
        "bg-siren-glow": "bgSirenGlow 1.25s ease-in-out infinite alternate",
        "border-siren-glow":
          "borderSirenGlow 1.25s ease-in-out infinite alternate"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" }
        },
        popIn: {
          "0%": { transform: "scale(0)" },
          "100%": { transform: "scale(1)" }
        },
        bgSirenGlow: {
          "0%": { backgroundColor: "#f43f5e" },
          "50%": { backgroundColor: "#be123c" },
          "100%": { backgroundColor: "#f43f5e" }
        },
        borderSirenGlow: {
          "0%": { borderColor: "#f43f5e" },
          "50%": { borderColor: "#be123c" },
          "100%": { borderColor: "#f43f5e" }
        }
      }
    }
  },
  important: true,
  darkMode: "class",
  plugins: [nextui()]
}
export default config
