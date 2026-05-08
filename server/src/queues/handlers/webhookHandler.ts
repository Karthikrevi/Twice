import { query } from "../../db/pool";
import { emitToRestaurant } from "../../realtime/io";
import { platformSyncQueue } from "..";

interface NormalizedOrder {
  restaurantId: string;
  platform: "talabat" | "deliveroo" | "instashop";
  externalId: string;
  shortId: string;
  customerName?: string;
  address?: string;
  totalCents: number;
  specialInstructions?: string;
  items: { name: string; qty: number; priceCents: number; menuItemId?: string }[];
}

export async function handler(payload: NormalizedOrder) {
  const existing = await query(
    `SELECT id FROM orders WHERE restaurant_id=$1 AND platform=$2 AND external_id=$3`,
    [payload.restaurantId, payload.platform, payload.externalId]
  );
  if (existing.rowCount) return;

  const ins = await query(
    `INSERT INTO orders (restaurant_id, short_id, platform, external_id, status, customer_name, delivery_address, total_cents, special_instructions)
     VALUES ($1,$2,$3,$4,'new',$5,$6,$7,$8) RETURNING id`,
    [
      payload.restaurantId,
      payload.shortId,
      payload.platform,
      payload.externalId,
      payload.customerName,
      payload.address,
      payload.totalCents,
      payload.specialInstructions,
    ]
  );
  const orderId = ins.rows[0].id as string;

  for (const it of payload.items) {
    await query(
      `INSERT INTO order_items (restaurant_id, order_id, menu_item_id, name_snapshot, qty, price_cents)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [payload.restaurantId, orderId, it.menuItemId ?? null, it.name, it.qty, it.priceCents]
    );

    if (it.menuItemId) {
      const upd = await query(
        `UPDATE stock_levels SET quantity = GREATEST(0, quantity - $1), updated_at=now()
         WHERE menu_item_id=$2 RETURNING quantity, restaurant_id`,
        [it.qty, it.menuItemId]
      );
      const row = upd.rows[0];
      if (row && row.quantity === 0) {
        await query(`UPDATE menu_items SET available=false WHERE id=$1`, [it.menuItemId]);
        await platformSyncQueue.add("pause", {
          restaurantId: payload.restaurantId,
          menuItemId: it.menuItemId,
          available: false,
        });
      }
    }
  }

  await query(
    `INSERT INTO order_status_history (restaurant_id, order_id, from_status, to_status) VALUES ($1,$2,NULL,'new')`,
    [payload.restaurantId, orderId]
  );

  emitToRestaurant(payload.restaurantId, "order:new", { id: orderId });
}
