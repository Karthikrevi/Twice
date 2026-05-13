import axios, { AxiosError, type AxiosInstance } from "axios";
import * as Sentry from "@sentry/node";
import { env } from "../env";

// Talabat + InstaShop both sit on the Delivery Hero vendor POS API.
const BASE_URL = env.platformSandbox
  ? "https://api-sandbox.delivery-hero.com"
  : "https://api.delivery-hero.com";

// ---------- shared error class ----------

export class DeliveryHeroError extends Error {
  status?: number;
  code: "token_expired" | "rate_limit" | "network" | "other";
  constructor(message: string, code: DeliveryHeroError["code"], status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ---------- shared axios client w/ retry on 429 ----------

const MAX_RETRIES = 3;

function clientFor(vendorToken: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${vendorToken}`,
      "Content-Type": "application/json",
      "User-Agent": "Once/1.0 (+https://once.app)",
    },
  });
}

async function call<T>(
  fn: () => Promise<T>,
  ctx: { platform: "talabat" | "instashop"; restaurantId: string; op: string }
): Promise<T> {
  let attempt = 0;
  // Exponential backoff: 250ms, 500ms, 1000ms.
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const ax = err as AxiosError;
      const status = ax.response?.status;

      if (status === 401) {
        Sentry.captureException(err, {
          tags: {
            kind: "integration",
            platform: ctx.platform,
            restaurant_id: ctx.restaurantId,
            op: ctx.op,
            reason: "token_expired",
          },
        });
        throw new DeliveryHeroError("Delivery Hero token expired", "token_expired", 401);
      }

      if (status === 429 && attempt < MAX_RETRIES) {
        const wait = 250 * 2 ** attempt;
        attempt++;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      Sentry.captureException(err, {
        tags: {
          kind: "integration",
          platform: ctx.platform,
          restaurant_id: ctx.restaurantId,
          op: ctx.op,
          reason: status === 429 ? "rate_limit" : "network",
        },
      });
      throw new DeliveryHeroError(
        ax.message ?? "Delivery Hero request failed",
        status === 429 ? "rate_limit" : "network",
        status
      );
    }
  }
}

// ---------- types ----------

export interface DeliveryHeroOrder {
  order_id: string;
  vendor_id: string;
  customer?: { name?: string };
  delivery?: { address?: string };
  notes?: string;
  total: number; // in AED, not cents
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    menu_item_id?: string;
  }[];
  created_at: string;
}

// ---------- functions ----------

export async function getOrders(
  vendorToken: string,
  restaurantId: string,
  platform: "talabat" | "instashop" = "talabat"
): Promise<DeliveryHeroOrder[]> {
  return call(
    async () => {
      const c = clientFor(vendorToken);
      const { data } = await c.get<{ orders: DeliveryHeroOrder[] }>(
        `/v2/restaurants/${restaurantId}/orders?status=pending`
      );
      return data.orders ?? [];
    },
    { platform, restaurantId, op: "getOrders" }
  );
}

export async function acknowledgeOrder(
  vendorToken: string,
  orderId: string,
  restaurantId: string,
  platform: "talabat" | "instashop" = "talabat"
): Promise<void> {
  await call(
    async () => {
      const c = clientFor(vendorToken);
      await c.post(`/v2/orders/${orderId}/acknowledge`, {
        acknowledged_at: new Date().toISOString(),
      });
    },
    { platform, restaurantId, op: "acknowledgeOrder" }
  );
}

export async function rejectOrder(
  vendorToken: string,
  orderId: string,
  reason: string,
  restaurantId: string,
  platform: "talabat" | "instashop" = "talabat"
): Promise<void> {
  await call(
    async () => {
      const c = clientFor(vendorToken);
      await c.post(`/v2/orders/${orderId}/reject`, { reason });
    },
    { platform, restaurantId, op: "rejectOrder" }
  );
}

export async function updateItemAvailability(
  vendorToken: string,
  menuItemId: string,
  available: boolean,
  restaurantId: string,
  platform: "talabat" | "instashop" = "talabat"
): Promise<void> {
  await call(
    async () => {
      const c = clientFor(vendorToken);
      await c.patch(`/v2/menu-items/${menuItemId}`, { available });
    },
    { platform, restaurantId, op: "updateItemAvailability" }
  );
}

export async function updateMenuItemStock(
  vendorToken: string,
  menuItemId: string,
  quantity: number,
  restaurantId: string,
  platform: "talabat" | "instashop" = "talabat"
): Promise<void> {
  await call(
    async () => {
      const c = clientFor(vendorToken);
      await c.patch(`/v2/menu-items/${menuItemId}/stock`, { quantity });
    },
    { platform, restaurantId, op: "updateMenuItemStock" }
  );
}
