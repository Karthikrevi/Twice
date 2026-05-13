import axios, { AxiosError, type AxiosInstance } from "axios";
import * as Sentry from "@sentry/node";
import { env } from "../env";
import { query } from "../db/pool";
import { encrypt } from "../lib/crypto";

const BASE_URL = env.platformSandbox
  ? "https://api-sandbox.developers.deliveroo.com"
  : "https://api.developers.deliveroo.com";

const MAX_RETRIES = 3;

export interface DeliverooCredentials {
  restaurantId: string;
  accessToken: string;
  refreshToken: string;
}

export class DeliverooError extends Error {
  status?: number;
  code: "token_expired" | "rate_limit" | "refresh_failed" | "network" | "other";
  constructor(message: string, code: DeliverooError["code"], status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ---------- OAuth token refresh ----------

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

async function refreshAccessToken(
  credentials: DeliverooCredentials
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const { data } = await axios.post<RefreshResponse>(
      `${BASE_URL}/oauth2/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credentials.refreshToken,
      }),
      {
        timeout: 10_000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const newAccess = data.access_token;
    const newRefresh = data.refresh_token ?? credentials.refreshToken;

    // Persist the rotated tokens encrypted.
    const enc = encrypt(JSON.stringify({ accessToken: newAccess, refreshToken: newRefresh }));
    await query(
      `UPDATE platform_credentials
         SET encrypted_token = $1, iv = $2, auth_tag = $3, status = 'connected', updated_at = now()
       WHERE restaurant_id = $4 AND platform = 'deliveroo'`,
      [enc.encrypted, enc.iv, enc.authTag, credentials.restaurantId]
    );

    return { accessToken: newAccess, refreshToken: newRefresh };
  } catch (err) {
    Sentry.captureException(err, {
      tags: {
        kind: "integration",
        platform: "deliveroo",
        restaurant_id: credentials.restaurantId,
        op: "refreshAccessToken",
      },
    });
    throw new DeliverooError("Deliveroo refresh failed", "refresh_failed", 401);
  }
}

// ---------- shared call helper ----------

function clientFor(accessToken: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": "Once/1.0 (+https://once.app)",
    },
  });
}

async function call<T>(
  credentials: DeliverooCredentials,
  fn: (accessToken: string) => Promise<T>,
  ctx: { op: string }
): Promise<T> {
  let attempt = 0;
  let accessToken = credentials.accessToken;
  let refreshed = false;

  while (true) {
    try {
      return await fn(accessToken);
    } catch (err) {
      const ax = err as AxiosError;
      const status = ax.response?.status;

      // Token expired — refresh once and retry the original request.
      if (status === 401 && !refreshed) {
        const rotated = await refreshAccessToken(credentials);
        accessToken = rotated.accessToken;
        credentials.accessToken = rotated.accessToken;
        credentials.refreshToken = rotated.refreshToken;
        refreshed = true;
        continue;
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
          platform: "deliveroo",
          restaurant_id: credentials.restaurantId,
          op: ctx.op,
          reason:
            status === 401
              ? "token_expired"
              : status === 429
              ? "rate_limit"
              : "network",
        },
      });
      throw new DeliverooError(
        ax.message ?? "Deliveroo request failed",
        status === 401
          ? "token_expired"
          : status === 429
          ? "rate_limit"
          : "network",
        status
      );
    }
  }
}

// ---------- types ----------

export interface DeliverooOrder {
  id: string;
  status: string;
  customer_name?: string;
  delivery_address?: string;
  notes?: string;
  total_price: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    pos_id?: string;
  }[];
  created_at: string;
}

// ---------- functions ----------

export async function getOrders(
  credentials: DeliverooCredentials
): Promise<DeliverooOrder[]> {
  return call(
    credentials,
    async (token) => {
      const c = clientFor(token);
      const { data } = await c.get<{ orders: DeliverooOrder[] }>(
        `/v1/restaurants/${credentials.restaurantId}/orders?state=placed`
      );
      return data.orders ?? [];
    },
    { op: "getOrders" }
  );
}

export async function acknowledgeOrder(
  credentials: DeliverooCredentials,
  orderId: string
): Promise<void> {
  await call(
    credentials,
    async (token) => {
      const c = clientFor(token);
      await c.patch(`/v1/orders/${orderId}`, { status: "accepted" });
    },
    { op: "acknowledgeOrder" }
  );
}

export async function rejectOrder(
  credentials: DeliverooCredentials,
  orderId: string,
  reason: string
): Promise<void> {
  await call(
    credentials,
    async (token) => {
      const c = clientFor(token);
      await c.patch(`/v1/orders/${orderId}`, {
        status: "rejected",
        reason,
      });
    },
    { op: "rejectOrder" }
  );
}

export async function updateItemAvailability(
  credentials: DeliverooCredentials,
  menuItemId: string,
  available: boolean
): Promise<void> {
  await call(
    credentials,
    async (token) => {
      const c = clientFor(token);
      await c.patch(`/v1/menu/items/${menuItemId}`, { available });
    },
    { op: "updateItemAvailability" }
  );
}
