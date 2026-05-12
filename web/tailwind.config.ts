import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0D0F14",
        surface: "#161920",
        surfaceActive: "#1E2128",
        border: "#2C2F3A",
        amber: {
          DEFAULT: "#F5A623",
          pressed: "#D4891A",
        },
        platform: {
          talabat: "#FF6D00",
          deliveroo: "#00CCBC",
          instashop: "#43A047",
          dinein: "#7C6AF5",
          takeaway: "#E8A838",
        },
        status: {
          available: "#22C55E",
          occupied: "#F59E0B",
          urgent: "#EF4444",
        },
        text: {
          primary: "#F1F3F7",
          secondary: "#8B90A0",
          muted: "#4A4F5E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
