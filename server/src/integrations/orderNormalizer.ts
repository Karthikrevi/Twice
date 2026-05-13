import { query } from "../db/pool";

export type Platform = "talabat" | "deliveroo" | "instashop";

export interface NormalizedOrder {
  restaurantId: string;
  platform: Platform;
  externalId: string;
  shortId: string;
  customerName?: string;
  address?: string;
  totalCents: number;
  specialInstructions?: string;
  items: {
    name: string;
    qty: number;
    priceCents: number;
    menuItemId?: string;
  }[];
}

// In-memory cache of menu_item lookups keyed by `${restaurantId}:${lower(name)}`.
// Cleared between cold starts; refreshed lazily.
const menuItemCache = new Map<string, string>();
const cacheKey = (restaurantId: string, name: string) =>
  `${restaurantId}:${name.trim().toLowerCase()}`;

async function lookupMenuItemId(
  restaurantId: string,
  name: string
): Promise<string | undefined> {
  if (!name) return undefined;
  const key = cacheKey(restaurantId, name);
  const cached = menuItemCache.get(key);
  if (cached) return cached;

  const r = await query<{ id: string }>(
    `SELECT id FROM menu_items WHERE restaurant_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1`,
    [restaurantId, name.trim()]
  );
  const id = r.rows[0]?.id;
  if (id) menuItemCache.set(key, id);
  return id;
}

interface RawDeliveryHero {
  order_id: string | number;
  customer?: { name?: string };
  delivery?: { address?: string };
  notes?: string;
  total: number;
  items?: {
    name: string;
    quantity: number;
    unit_price: number;
    menu_item_id?: string;
  }[];
}

interface RawDeliveroo {
  order: {
    id: string | number;
    customer_name?: string;
    delivery_address?: string;
    notes?: string;
    total_price: number;
    items?: {
      name: string;
      quantity: number;
      price: number;
      pos_id?: string;
    }[];
  };
}

interface RawInstaShop {
  id: string | number;
  customer_name?: string;
  address?: string;
  total: number;
  line_items?: {
    name: string;
    qty: number;
    price: number;
    sku?: string;
  }[];
}

type RawPayload = RawDeliveryHero | RawDeliveroo | RawInstaShop;

const shortId = (platform: Platform, externalId: string) => {
  const prefix = platform === "talabat" ? "TLB" : platform === "deliveroo" ? "DLR" : "INS";
  return `#${prefix}-${externalId.slice(-4)}`;
};

export async function normalizeOrder(
  platform: Platform,
  restaurantId: string,
  body: RawPayload
): Promise<NormalizedOrder> {
  switch (platform) {
    case "talabat": {
      const b = body as RawDeliveryHero;
      const externalId = String(b.order_id);
      const items = await Promise.all(
        (b.items ?? []).map(async (i) => ({
          name: i.name,
          qty: Number(i.quantity),
          priceCents: Math.round(Number(i.unit_price) * 100),
          menuItemId:
            i.menu_item_id ??
            (await lookupMenuItemId(restaurantId, i.name)),
        }))
      );
      return {
        restaurantId,
        platform,
        externalId,
        shortId: shortId(platform, externalId),
        customerName: b.customer?.name,
        address: b.delivery?.address,
        totalCents: Math.round(Number(b.total) * 100),
        specialInstructions: b.notes,
        items,
      };
    }

    case "deliveroo": {
      const b = body as RawDeliveroo;
      const externalId = String(b.order.id);
      const items = await Promise.all(
        (b.order.items ?? []).map(async (i) => ({
          name: i.name,
          qty: Number(i.quantity),
          priceCents: Math.round(Number(i.price) * 100),
          menuItemId:
            i.pos_id ?? (await lookupMenuItemId(restaurantId, i.name)),
        }))
      );
      return {
        restaurantId,
        platform,
        externalId,
        shortId: shortId(platform, externalId),
        customerName: b.order.customer_name,
        address: b.order.delivery_address,
        totalCents: Math.round(Number(b.order.total_price) * 100),
        specialInstructions: b.order.notes,
        items,
      };
    }

    case "instashop": {
      const b = body as RawInstaShop;
      const externalId = String(b.id);
      const items = await Promise.all(
        (b.line_items ?? []).map(async (i) => ({
          name: i.name,
          qty: Number(i.qty),
          priceCents: Math.round(Number(i.price) * 100),
          menuItemId:
            i.sku ?? (await lookupMenuItemId(restaurantId, i.name)),
        }))
      );
      return {
        restaurantId,
        platform,
        externalId,
        shortId: shortId(platform, externalId),
        customerName: b.customer_name,
        address: b.address,
        totalCents: Math.round(Number(b.total) * 100),
        items,
      };
    }
  }
}
