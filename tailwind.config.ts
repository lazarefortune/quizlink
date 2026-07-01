import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/** Couleurs sémantiques du design system — utilisables via `text-cobalt`, `bg-warning`, etc. */
const designSystemSemanticColors = [
  "warning",
  "highlight",
  "blue",
  "purple",
  "cobalt",
] as const;

const designSystemColorNames = designSystemSemanticColors.join("|");

const designSystemColorSafelist: NonNullable<Config["safelist"]> = [
  {
    pattern: new RegExp(
      `^(bg|text|border|ring|fill|stroke|outline|decoration|divide|caret|accent)-(${designSystemColorNames})(-foreground)?$`
    ),
    variants: ["hover", "focus", "focus-visible", "active", "disabled", "dark", "group-hover"],
  },
  {
    pattern: new RegExp(
      `^(bg|text|border|ring|from|to|via)-(${designSystemColorNames})(-foreground)?/(\\d{1,3})$`
    ),
    variants: ["hover", "focus", "dark", "group-hover"],
  },
];

const designSystemColors = {
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  highlight: {
    DEFAULT: "hsl(var(--highlight))",
    foreground: "hsl(var(--highlight-foreground))",
  },
  blue: {
    DEFAULT: "hsl(var(--blue))",
    foreground: "hsl(var(--blue-foreground))",
  },
  purple: {
    DEFAULT: "hsl(var(--purple))",
    foreground: "hsl(var(--purple-foreground))",
  },
  cobalt: {
    DEFAULT: "hsl(var(--cobalt))",
    foreground: "hsl(var(--cobalt-foreground))",
  },
} as const;

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  safelist: designSystemColorSafelist,
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ...designSystemColors,
      },
      fontFamily: {
        sans: ["var(--font-fredoka)", "ui-sans-serif", "system-ui", "sans-serif"],
        fredoka: ["var(--font-fredoka)", "ui-sans-serif", "system-ui", "sans-serif"],
        rubik: ["var(--font-fredoka)", "ui-sans-serif", "system-ui", "sans-serif"],
        "sn-pro": ["SN Pro", "ui-sans-serif", "system-ui", "sans-serif"],
        "sofia-sans": ["var(--font-sofia-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      height: {
        13: "3.25rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        xxs: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /** Radix Collapsible (`--radix-collapsible-content-height`) — builder mobile options */
        "collapsible-down": {
          from: { height: "0" },
          to: { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          from: { height: "var(--radix-collapsible-content-height)" },
          to: { height: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
        "collapsible-up": "collapsible-up 0.26s cubic-bezier(0.22, 1, 0.36, 1)",
        wiggle: "wiggle 1s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "bounce-in": "bounce-in 0.6s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
