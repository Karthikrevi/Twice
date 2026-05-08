import { query } from "../../db/pool";
import { decrypt } from "../../lib/crypto";

interface SyncJob {
  restaurantId: string;
  menuItemId: string;
  available: boolean;
}

export async function syncAvailability(job: SyncJob) {
  const creds = await query(
    `SELECT platform, encrypted_token, iv, auth_tag FROM platform_credentials WHERE restaurant_id=$1`,
    [job.restaurantId]
  );

  for (const c of creds.rows) {
    const token = decrypt(c.encrypted_token, c.iv, c.auth_tag);
    // Real implementations would call Talabat / Deliveroo / InstaShop APIs.
    // We log so the action is traceable via the audit + Sentry breadcrumbs.
    console.log(
      `[sync] ${c.platform} restaurant=${job.restaurantId} item=${job.menuItemId} available=${job.available} (token=${token.slice(0, 4)}…)`
    );
  }
}
