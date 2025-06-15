import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
        heading: ["var(--font-heading)", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "70ch",
            fontFamily: "var(--font-serif)",
            color: "hsl(var(--foreground))",
            h1: {
              fontFamily: "var(--font-heading)",
              color: "hsl(var(--foreground))",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h2: {
              fontFamily: "var(--font-heading)",
              color: "hsl(var(--foreground))",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h3: {
              fontFamily: "var(--font-heading)",
              color: "hsl(var(--foreground))",
              fontWeight: "600",
              letterSpacing: "-0.025em",
            },
            h4: {
              fontFamily: "var(--font-heading)",
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            a: {
              color: "hsl(var(--primary))",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              textDecorationThickness: "1px",
              "&:hover": {
                color: "hsl(var(--primary))",
                textDecorationThickness: "2px",
              },
            },
            blockquote: {
              borderLeftColor: "hsl(var(--primary))",
              color: "hsl(var(--muted-foreground))",
              fontStyle: "italic",
            },
            img: {
              borderRadius: "0.5rem",
            },
          },
        },
      },
      boxShadow: {
        formal: "0 1px 3px rgba(0, 0, 0, 0.05)",
        "formal-hover": "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config

export default config
