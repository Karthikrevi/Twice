export type PlatformKey =
  | "talabat"
  | "deliveroo"
  | "instashop"
  | "dinein"
  | "takeaway";

export type OrderStatus = "new" | "preparing" | "ready" | "done";

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  shortId: string;
  platform: PlatformKey;
  status: OrderStatus;
  placedAt: string;
  items: OrderItem[];
  total: number;
  customerName?: string;
  address?: string;
  tableId?: string;
  specialInstructions?: string;
}

export interface RestaurantTable {
  id: string;
  name: string;
  guests: number;
  total: number;
  status: "available" | "occupied";
  openedAt?: string;
  sessionId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  available: boolean;
  category: string;
}
