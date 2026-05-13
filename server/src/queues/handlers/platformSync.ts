import * as Sentry from "@sentry/node";
import { query } from "../../db/pool";
import { decrypt } from "../../lib/crypto";
import {
  updateItemAvailability as deliveryHeroUpdateAvailability,
  updateMenuItemStock as deliveryHeroUpdateStock,
} from "../../integrations/deliveryHero";
import {
  updateItemAvailability as deliverooUpdateAvailability,
  type DeliverooCredentials,
} from "../../integrations/deliveroo";

interface AvailabilityJob {
  restaurantId: string;
  menuItemId: string;
  available: boolean;
}

interface StockJob {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
}

type Platform = "talabat" | "deliveroo" | "instashop";

interface CredRow {
  platform: Platform;
  encrypted_token: Buffer;
  iv: Buffer;
  auth_tag: Buffer;
  status: string;
}

async function loadCredentials(restaurantId: string): Promise<CredRow[]> {
  const r = await query<CredRow>(
    `SELECT platform, encrypted_token, iv, auth_tag, status
       FROM platform_credentials
      WHERE restaurant_id = $1 AND status = 'connected'`,
    [restaurantId]
  );
  return r.rows;
}

function plaintextOf(row: CredRow): string {
  return decrypt(row.encrypted_token, row.iv, row.auth_tag);
}

function deliverooCredsFor(
  row: CredRow,
  restaurantId: string
): DeliverooCredentials | null {
  try {
    const parsed = JSON.parse(plaintextOf(row)) as {
      accessToken: string;
      refreshToken: string;
    };
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return {
      restaurantId,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    };
  } catch {
    return null;
  }
}

// Fan an availability change out to every connected platform. Each call is
// independent — one platform failing doesn't block the others.
export async function syncAvailability(job: AvailabilityJob): Promise<void> {
  const creds = await loadCredentials(job.restaurantId);

  await Promise.all(
    creds.map(async (row) => {
      try {
        if (row.platform === "talabat" || row.platform === "instashop") {
          const vendorToken = plaintextOf(row);
          await deliveryHeroUpdateAvailability(
            vendorToken,
            job.menuItemId,
            job.available,
            job.restaurantId,
            row.platform
          );
        } else if (row.platform === "deliveroo") {
          const creds = deliverooCredsFor(row, job.restaurantId);
          if (!creds) return;
          await deliverooUpdateAvailability(
            creds,
            job.menuItemId,
            job.available
          );
        }
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            kind: "platform-sync",
            platform: row.platform,
            restaurant_id: job.restaurantId,
            op: "availability",
          },
        });
      }
    })
  );
}

// Stock pushes are Delivery-Hero only. Deliveroo doesn't expose a stock
// endpoint; availability flips at zero handle that side.
export async function syncStock(job: StockJob): Promise<void> {
  const creds = await loadCredentials(job.restaurantId);

  await Promise.all(
    creds.map(async (row) => {
      if (row.platform !== "talabat" && row.platform !== "instashop") return;
      try {
        const vendorToken = plaintextOf(row);
        await deliveryHeroUpdateStock(
          vendorToken,
          job.menuItemId,
          job.quantity,
          job.restaurantId,
          row.platform
        );
      } catch (e) {
        Sentry.captureException(e, {
          tags: {
            kind: "platform-sync",
            platform: row.platform,
            restaurant_id: job.restaurantId,
            op: "stock",
          },
        });
      }
    })
  );
}
