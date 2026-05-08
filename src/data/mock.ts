import type { Order, MenuItem, RestaurantTable, OrderStatus } from "@/types";

export const mockMenu: MenuItem[] = [
  { id: "m1", name: "Chicken Shawarma", price: 22, stock: 18, lowStockThreshold: 5, available: true, category: "Mains" },
  { id: "m2", name: "Lamb Mandi", price: 65, stock: 7, lowStockThreshold: 4, available: true, category: "Mains" },
  { id: "m3", name: "Mixed Grill", price: 89, stock: 4, lowStockThreshold: 5, available: true, category: "Mains" },
  { id: "m4", name: "Hummus", price: 18, stock: 30, lowStockThreshold: 10, available: true, category: "Starters" },
  { id: "m5", name: "Tabbouleh", price: 16, stock: 22, lowStockThreshold: 8, available: true, category: "Starters" },
  { id: "m6", name: "Fattoush", price: 19, stock: 14, lowStockThreshold: 8, available: true, category: "Starters" },
  { id: "m7", name: "Karak Tea", price: 8, stock: 0, lowStockThreshold: 10, available: false, category: "Beverages" },
  { id: "m8", name: "Fresh Lemon Mint", price: 14, stock: 25, lowStockThreshold: 5, available: true, category: "Beverages" },
  { id: "m9", name: "Umm Ali", price: 24, stock: 9, lowStockThreshold: 4, available: true, category: "Desserts" },
  { id: "m10", name: "Kunafa", price: 28, stock: 6, lowStockThreshold: 4, available: true, category: "Desserts" },
];

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export const mockOrders: Order[] = [
  {
    id: "o1",
    shortId: "#TLB-2841",
    platform: "talabat",
    status: "new",
    placedAt: minutesAgo(3),
    items: [
      { id: "i1", name: "Chicken Shawarma", qty: 2, price: 22 },
      { id: "i2", name: "Hummus", qty: 1, price: 18 },
    ],
    total: 62,
    customerName: "A. Rahman",
    address: "Jumeirah 1, Villa 22",
    specialInstructions: "No onions",
  },
  {
    id: "o2",
    shortId: "#DLR-9933",
    platform: "deliveroo",
    status: "preparing",
    placedAt: minutesAgo(11),
    items: [
      { id: "i3", name: "Lamb Mandi", qty: 1, price: 65 },
      { id: "i4", name: "Karak Tea", qty: 2, price: 8 },
    ],
    total: 81,
    customerName: "S. Khan",
    address: "Downtown, Burj Vista T2 1801",
  },
  {
    id: "o3",
    shortId: "#INS-1102",
    platform: "instashop",
    status: "ready",
    placedAt: minutesAgo(22),
    items: [{ id: "i5", name: "Mixed Grill", qty: 1, price: 89 }],
    total: 89,
    customerName: "M. Al Hashimi",
    address: "Al Barsha 2, Building 7",
  },
  {
    id: "o4",
    shortId: "#DIN-T3",
    platform: "dinein",
    status: "preparing",
    placedAt: minutesAgo(7),
    items: [
      { id: "i6", name: "Fattoush", qty: 2, price: 19 },
      { id: "i7", name: "Mixed Grill", qty: 1, price: 89 },
    ],
    total: 127,
    tableId: "t3",
  },
  {
    id: "o5",
    shortId: "#TKW-9981",
    platform: "takeaway",
    status: "new",
    placedAt: minutesAgo(1),
    items: [{ id: "i8", name: "Chicken Shawarma", qty: 3, price: 22 }],
    total: 66,
    customerName: "Walk-in",
  },
  {
    id: "o6",
    shortId: "#TLB-2845",
    platform: "talabat",
    status: "preparing",
    placedAt: minutesAgo(17),
    items: [
      { id: "i9", name: "Umm Ali", qty: 1, price: 24 },
      { id: "i10", name: "Kunafa", qty: 1, price: 28 },
    ],
    total: 52,
    customerName: "L. Younis",
    address: "JLT, Cluster N",
  },
];

export const mockTables: RestaurantTable[] = Array.from({ length: 12 }).map((_, i) => {
  const occupied = [2, 4, 7, 10].includes(i);
  return {
    id: `t${i + 1}`,
    name: `T${i + 1}`,
    guests: occupied ? [3, 2, 5, 4][[2, 4, 7, 10].indexOf(i)] : 0,
    total: occupied ? [127, 84, 215, 96][[2, 4, 7, 10].indexOf(i)] : 0,
    status: occupied ? "occupied" : "available",
    openedAt: occupied ? minutesAgo(30 + i * 5) : undefined,
    items: occupied
      ? [
          { id: `ti${i}-1`, name: "Mixed Grill", qty: 1, price: 89 },
          { id: `ti${i}-2`, name: "Fattoush", qty: 2, price: 19 },
        ]
      : [],
  };
});

export const statusFlow: OrderStatus[] = ["new", "preparing", "ready", "done"];

export const nextStatus = (s: OrderStatus): OrderStatus => {
  const i = statusFlow.indexOf(s);
  return statusFlow[Math.min(i + 1, statusFlow.length - 1)];
};

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
