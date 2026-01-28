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
        // Stanvault Design System - Sovereign Rebel Rebrand
        vault: {
          black: "#0A0A0A",      // Slightly deeper
          darker: "#141413",     // Warm undertone
          dark: "#1A1A1A",
          gray: "#2A2A2A",
          muted: "#6B6B6B",
        },
        warm: {
          white: "#F5F0E8",      // Warmer, more organic cream
          cream: "#F5F3EF",
          gray: "#E8E6E3",
        },
        gold: {
          DEFAULT: "#B8860B",    // Dark goldenrod - more organic
          light: "#C49B0C",      // Warmer hover
          dark: "#8B6914",       // Deeper press
          muted: "#B8860B33",
        },
        moss: {
          DEFAULT: "#2D4A3E",    // Secondary accent (activated)
          light: "#3D6352",      // Verified/success states
          dark: "#1F352C",
        },
        // New organic additions
        earth: "#3D2B1F",        // Deep brown for subtle organic accents
        sand: "#C2B280",         // Muted warm neutral
        status: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        tier: {
          casual: "#6B7280",
          engaged: "#3B82F6",
          dedicated: "#8B5CF6",
          superfan: "#B8860B",   // Updated to new gold
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Jost", "Futura", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",    // Slightly tighter (md)
      },
      letterSpacing: {
        brand: "0.15em",        // For wordmark and tracked text
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-gold": "pulseGold 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(184, 134, 11, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(184, 134, 11, 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
