import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12141A",
          soft: "#2B2F38",
        },
        muted: {
          DEFAULT: "#5B6472",
          subtle: "#8A93A1",
        },
        canvas: "#FFFFFF",
        surface: {
          DEFAULT: "#F5F6F8",
          alt: "#EEF0F3",
        },
        border: {
          DEFAULT: "#DDE1E6",
          strong: "#C6CBD2",
        },
        primary: {
          DEFAULT: "#24399B",
          strong: "#182C77",
          soft: "#EEF1FC",
        },
        success: {
          DEFAULT: "#1F7A4D",
          soft: "#E7F5ED",
        },
        warning: {
          DEFAULT: "#A8641D",
          soft: "#FBF0E3",
        },
        danger: {
          DEFAULT: "#B3392C",
          soft: "#FBEAE8",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.6rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
      boxShadow: {
        elevation: "0 4px 16px -4px rgba(18, 20, 26, 0.12), 0 2px 4px -2px rgba(18, 20, 26, 0.08)",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
