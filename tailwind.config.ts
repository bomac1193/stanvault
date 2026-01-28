import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // STANVAULT - Bourgeois Rebel Design System
        // "Balenciaga meets Apple meets Napster"

        // Core: Pure black & white - no compromise
        black: "#000000",
        white: "#FFFFFF",

        // The rebel satisfies - electric, alive, unapologetic
        accent: {
          DEFAULT: "#FF2D92",  // Hot pink - Balenciaga energy
          dim: "#FF2D9233",
          bright: "#FF5AAB",
        },

        // Secondary accent - luxury, creative
        purple: {
          DEFAULT: "#8B5CF6",
          dim: "#8B5CF633",
          bright: "#A78BFA",
        },

        // Grayscale - intentionally limited
        gray: {
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },

        // Status - muted, not screaming
        status: {
          success: "#00FF88",
          warning: "#FFD600",
          error: "#FF0040",
          info: "#0066FF",
        },

        // Tier colors - monochrome hierarchy
        tier: {
          casual: "#737373",
          engaged: "#A3A3A3",
          dedicated: "#D4D4D4",
          superfan: "#FFFFFF",
        },

        // Legacy aliases for compatibility
        vault: {
          black: "#000000",
          darker: "#0A0A0A",
          dark: "#171717",
          gray: "#262626",
          muted: "#737373",
        },
        warm: {
          white: "#FFFFFF",
          cream: "#F5F5F5",
          gray: "#E5E5E5",
        },
        gold: {
          DEFAULT: "#FF2D92",
          light: "#FF5AAB",
          dark: "#CC2476",
          muted: "#FF2D9233",
        },
        moss: {
          DEFAULT: "#00FF88",
          light: "#33FF9F",
          dark: "#00CC6A",
        },

        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        // Grotesk stack - brutal, clean, Virgil-approved
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        display: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        mono: ["SF Mono", "Consolas", "monospace"],
      },
      fontSize: {
        // Brutal scale - make statements
        'display-xl': ['8rem', { lineHeight: '0.85', letterSpacing: '-0.04em' }],
        'display-lg': ['5rem', { lineHeight: '0.9', letterSpacing: '-0.03em' }],
        'display-md': ['3rem', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-sm': ['2rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
        'body-lg': ['1.25rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'overline': ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        bold: '700',
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.05em',
        widest: '0.1em',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        full: '9999px',
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-accent": "pulseAccent 2s infinite",
        "glitch": "glitch 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseAccent: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
