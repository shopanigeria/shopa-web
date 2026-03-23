import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        "primary-dark": "#1d5620",
        "primary-light": "#40a645",
        secondary: "#FDC500",
        "neutral-black": "#151515",
        "neutral-gray": "#9b9b9b",
        "neutral-light": "#eaeaea",
        "neutral-white": "#FFFFFF",
      },
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
