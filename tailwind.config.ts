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
        neon: "#00E5A0",
        "neon-dim": "rgba(0,229,160,0.12)",
        "neon-glow": "rgba(0,229,160,0.35)",
        glass: {
          "1": "rgba(255,255,255,0.05)",
          "2": "rgba(255,255,255,0.08)",
          "3": "rgba(255,255,255,0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "10px",
        lg: "12px",
        xl: "14px",
      },
      backdropBlur: {
        glass: "20px",
      },
      backdropSaturate: {
        glass: "180%",
      },
    },
  },
  plugins: [],
};

export default config;
