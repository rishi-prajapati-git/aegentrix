/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        chassis: {
          DEFAULT: "var(--dp-color-chassis)",
          raised: "var(--dp-color-raised)",
          well: "var(--dp-color-well)",
          ink: "var(--dp-color-ink)",
          label: "var(--dp-color-label)",
          field: "var(--dp-color-field)",
          onField: "var(--dp-color-on-field)",
          onFieldMuted: "var(--dp-color-on-field-muted)",
          accent: "var(--dp-color-accent)",
        },
      },
      fontFamily: {
        sans: ["var(--dp-typography-sans)"],
        mono: ["var(--dp-typography-mono)"],
      },
      boxShadow: {
        chassis: "0 20px 40px -15px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)",
        key: "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 0 #959fa4, 0 3px 5px rgba(0,0,0,0.2)",
        "key-hover": "inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 0 #8b959a, 0 5px 8px rgba(0,0,0,0.22)",
        "key-pressed": "inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.6)",
        well: "inset 0 2px 4px rgba(0,0,0,0.25), inset 0 0 2px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.8)",
        screen: "inset 0 3px 6px rgba(0,0,0,0.5), inset 0 0 1px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.4)",
        dial: "inset 0 2px 0 rgba(255,255,255,0.9), 0 4px 8px rgba(0,0,0,0.3), 0 1px 0 #828c91",
        "dial-pressed": "inset 0 3px 5px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.5)",
      },
      borderRadius: {
        key: "var(--dp-radius-key)",
      },
    },
  },
  plugins: [],
};
