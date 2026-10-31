/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "var(--dp-color-ground)",
        ink: {
          DEFAULT: "var(--dp-color-ink)",
          secondary: "var(--dp-color-ink-secondary)",
        },
        clay: {
          accent: "var(--dp-color-accent)",
          mint: "var(--dp-color-surface-support)",
          lavender: "var(--dp-color-surface-compare)",
          warm: "var(--dp-color-surface-warm)",
          cool: "var(--dp-color-surface-cool)",
          surface: "var(--dp-color-surface)",
        },
      },
      fontFamily: {
        sans: ["var(--dp-typography-face)", "sans-serif"],
        mono: ["var(--dp-typography-mono)", "monospace"],
      },
      borderRadius: {
        surface: "var(--dp-radius-surface)",
        tray: "var(--dp-radius-tray)",
        control: "var(--dp-radius-control)",
        disclosure: "var(--dp-radius-disclosure)",
      },
      boxShadow: {
        clay: "0 16px 32px -8px rgba(56, 49, 57, 0.12), inset 3px 3px 6px rgba(255, 255, 255, 0.75), inset -3px -3px 7px rgba(56, 49, 57, 0.12)",
        "clay-tray": "0 20px 40px -12px rgba(56, 49, 57, 0.10), inset 4px 4px 8px rgba(255, 255, 255, 0.9), inset -4px -4px 8px rgba(56, 49, 57, 0.08)",
        "clay-btn": "inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(56, 49, 57, 0.15), 0 6px 14px -3px rgba(56, 49, 57, 0.16)",
        "clay-btn-hover": "inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(56, 49, 57, 0.15), 0 10px 18px -3px rgba(56, 49, 57, 0.20)",
        "clay-btn-pressed": "inset 2px 2px 5px rgba(56, 49, 57, 0.22), inset -1px -1px 3px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(56, 49, 57, 0.12)",
        "clay-recessed": "inset 3px 3px 6px rgba(56, 49, 57, 0.14), inset -2px -2px 5px rgba(255, 255, 255, 0.7)",
        "clay-disclosure": "0 8px 18px -4px rgba(56, 49, 57, 0.08), inset 2px 2px 5px rgba(255, 255, 255, 0.85), inset -2px -2px 5px rgba(56, 49, 57, 0.08)",
      },
      transitionDuration: {
        interaction: "var(--dp-motion-interaction)",
      },
    },
  },
  plugins: [],
};
