export const theme = {
  bg: "#0D0F14",
  surface: "#161920",
  surfaceActive: "#1E2128",
  border: "#2C2F3A",
  amber: "#F5A623",
  amberPressed: "#D4891A",
  text: {
    primary: "#F1F3F7",
    secondary: "#8B90A0",
    muted: "#4A4F5E",
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
} as const;

export type PlatformKey = keyof typeof theme.platform;

export const platformLabel: Record<PlatformKey, string> = {
  talabat: "Talabat",
  deliveroo: "Deliveroo",
  instashop: "InstaShop",
  dinein: "Dine-in",
  takeaway: "Takeaway",
};
