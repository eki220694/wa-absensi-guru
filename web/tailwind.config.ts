import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "calc(var(--radius) + 4px)",
        xl: "var(--radius-xl)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        /* Semantic alias colors */
        brand: { DEFAULT: "hsl(var(--color-brand))", foreground: "hsl(var(--color-brand-fg))" },
        surface: {
          1: "hsl(var(--color-surface-1))",
          2: "hsl(var(--color-surface-2))",
          3: "hsl(var(--color-surface-3))",
        },
        success: { DEFAULT: "hsl(var(--color-success))", foreground: "hsl(var(--color-success-fg))" },
        warning: { DEFAULT: "hsl(var(--color-warning))", foreground: "hsl(var(--color-warning-fg))" },
        danger: { DEFAULT: "hsl(var(--color-danger))", foreground: "hsl(var(--color-danger-fg))" },
        info: { DEFAULT: "hsl(var(--color-info))", foreground: "hsl(var(--color-info-fg))" },

        /* Chart colors */
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          grid: "hsl(var(--chart-grid))",
          axis: "hsl(var(--chart-axis))",
        },

        sidebar: { DEFAULT: "hsl(var(--sidebar))", foreground: "hsl(var(--sidebar-foreground))", primary: "hsl(var(--sidebar-primary))", "primary-foreground": "hsl(var(--sidebar-primary-foreground))", accent: "hsl(var(--sidebar-accent))", "accent-foreground": "hsl(var(--sidebar-accent-foreground))", border: "hsl(var(--sidebar-border))", ring: "hsl(var(--sidebar-ring))" },
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "var(--leading-tight)", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["var(--text-h1)", { lineHeight: "var(--leading-tight)", letterSpacing: "-0.01em", fontWeight: "700" }],
        h2: ["var(--text-h2)", { lineHeight: "var(--leading-snug)", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["var(--text-h3)", { lineHeight: "var(--leading-snug)", fontWeight: "600" }],
        body: ["var(--text-body)", { lineHeight: "var(--leading-relaxed)" }],
        sm: ["var(--text-sm)", { lineHeight: "var(--leading-normal)" }],
        xs: ["var(--text-xs)", { lineHeight: "var(--leading-normal)" }],
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "shimmer": { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;