import type {
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  PlatformKey,
  RestaurantTable,
} from "@/types";

interface ServerOrderItem {
  id: string;
  name: string;
  qty: number;
  priceCents: number;
  notes?: string | null;
}

interface ServerOrder {
  id: string;
  short_id: string;
  platform: PlatformKey;
  status: OrderStatus;
  customer_name: string | null;
  delivery_address: string | null;
  table_id: string | null;
  special_instructions: string | null;
  total_cents: number;
  placed_at: string;
  items: ServerOrderItem[];
}

export function mapOrder(row: ServerOrder): Order {
  const items: OrderItem[] = (row.items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    qty: i.qty,
    price: i.priceCents / 100,
    notes: i.notes ?? undefined,
  }));
  return {
    id: row.id,
    shortId: row.short_id,
    platform: row.platform,
    status: row.status,
    customerName: row.customer_name ?? undefined,
    address: row.delivery_address ?? undefined,
    tableId: row.table_id ?? undefined,
    specialInstructions: row.special_instructions ?? undefined,
    total: row.total_cents / 100,
    placedAt: row.placed_at,
    items,
  };
}

interface ServerTable {
  id: string;
  name: string;
  position: number;
  session_id: string | null;
  guests: number | null;
  opened_at: string | null;
  total_cents: number | null;
}

export function mapTable(row: ServerTable): RestaurantTable {
  const occupied = !!row.session_id;
  return {
    id: row.id,
    name: row.name,
    guests: row.guests ?? 0,
    total: (row.total_cents ?? 0) / 100,
    status: occupied ? "occupied" : "available",
    openedAt: row.opened_at ?? undefined,
    sessionId: row.session_id ?? undefined,
  };
}

interface ServerMenuItem {
  id: string;
  name: string;
  price_cents: number;
  category: string;
  available: boolean;
  low_stock_threshold: number;
  stock: number;
}

export function mapMenuItem(row: ServerMenuItem): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price_cents / 100,
    stock: Number(row.stock ?? 0),
    lowStockThreshold: row.low_stock_threshold,
    available: row.available,
    category: row.category,
  };
}

const FLOW: OrderStatus[] = ["new", "preparing", "ready", "done"];

export const nextStatus = (s: OrderStatus): OrderStatus =>
  FLOW[Math.min(FLOW.indexOf(s) + 1, FLOW.length - 1)];

export const minutesSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
