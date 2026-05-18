/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg:           "var(--bg)",
        surface:      "var(--surface)",
        "surface-2":  "var(--surface-2)",
        "surface-3":  "var(--surface-3)",
        border:       "var(--border)",
        "border-strong": "var(--border-strong)",
        text: {
          DEFAULT: "var(--text)",
          2:       "var(--text-2)",
          3:       "var(--text-3)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          2:       "var(--accent-2)",
          soft:    "var(--accent-soft)",
        },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        danger:  { DEFAULT: "var(--danger)",  soft: "var(--danger-soft)" },
        nav: {
          DEFAULT: "var(--nav)",
          text:    "var(--nav-text)",
          mute:    "var(--nav-mute)",
          accent:  "var(--nav-accent)",
        },
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideRight: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideUp: {
          "0%":   { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":     "fadeUp 0.2s ease-out",
        "scale-in":    "scaleIn 0.18s ease-out",
        "slide-right": "slideRight 0.24s cubic-bezier(.4,0,.2,1)",
        "slide-up":    "slideUp 0.24s cubic-bezier(.4,0,.2,1)",
        "fade-in":     "fadeIn 0.22s ease-out",
      },
    }
  },
  plugins: []
}
