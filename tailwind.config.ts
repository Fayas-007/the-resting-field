import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        "hero-subtitle": "hsl(var(--hero-subtitle))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        /* Slow ken-burns on the gate plate so the hero never sits perfectly still. */
        drift: {
          "0%, 100%": { transform: "scale(1.06) translate3d(0, 0, 0)" },
          "50%": { transform: "scale(1.13) translate3d(-1.5%, -1%, 0)" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.5" },
          "45%": { opacity: "0.32" },
          "55%": { opacity: "0.62" },
        },
        /* Ash falling through the gate. */
        ash: {
          "0%": { transform: "translate3d(0, -10vh, 0)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translate3d(-6vw, 105vh, 0)", opacity: "0" },
        },
      },
      animation: {
        drift: "drift 32s ease-in-out infinite",
        flicker: "flicker 5s ease-in-out infinite",
        ash: "ash 18s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
