/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
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
          primary: "#F5F6F8",
          secondary: "#9AA0AE",
          muted: "#6B7080",
        },
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
