import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, query } from "../db/pool";
import { encrypt } from "../lib/crypto";
import { PRIVACY_POLICY_VERSION } from "./privacy";

export const setupRouter = Router();

const setupSchema = z.object({
  restaurant: z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    kitchenOutput: z.enum(["screen", "printer"]),
    tableCount: z.number().int().min(1).max(200),
  }),
  owner: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6).optional(),
      googleId: z.string().min(1).optional(),
    })
    .refine((d) => !!d.password || !!d.googleId, {
      message: "Either password or googleId is required",
    }),
  consent: z.boolean().optional(),
  menu: z.array(z.object({ name: z.string(), priceCents: z.number().int().min(0), stock: z.number().int().min(0) })),
  staff: z.array(
    z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["manager", "waiter", "kitchen"]),
    })
  ),
  platforms: z
    .object({
      deliveryHeroToken: z.string().optional(),
      deliverooToken: z.string().optional(),
    })
    .optional(),
});

setupRouter.post("/", async (req, res) => {
  const parsed = setupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input", details: parsed.error.flatten() });
  const data = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const r = await client.query(
      `INSERT INTO restaurants (name, location, kitchen_output, table_count, setup_complete)
       VALUES ($1,$2,$3,$4,true) RETURNING id`,
      [data.restaurant.name, data.restaurant.location, data.restaurant.kitchenOutput, data.restaurant.tableCount]
    );
    const restaurantId = r.rows[0].id;

    const ownerHash = data.owner.password
      ? await bcrypt.hash(data.owner.password, 10)
      : null;
    await client.query(
      `INSERT INTO users
         (restaurant_id, email, password_hash, name, role, google_id,
          consent_given, consent_date, consent_version)
       VALUES ($1,$2,$3,$4,'owner',$5,$6,$7,$8)`,
      [
        restaurantId,
        data.owner.email,
        ownerHash,
        data.owner.name,
        data.owner.googleId ?? null,
        !!data.consent,
        data.consent ? new Date() : null,
        data.consent ? PRIVACY_POLICY_VERSION : null,
      ]
    );

    // Default retention policy for the new restaurant.
    await client.query(
      `INSERT INTO data_retention_config (restaurant_id) VALUES ($1)
       ON CONFLICT (restaurant_id) DO NOTHING`,
      [restaurantId]
    );

    for (const s of data.staff) {
      const hash = await bcrypt.hash(s.password, 10);
      await client.query(
        `INSERT INTO users (restaurant_id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,$5)`,
        [restaurantId, s.email, hash, s.name, s.role]
      );
    }

    for (let i = 1; i <= data.restaurant.tableCount; i++) {
      await client.query(
        `INSERT INTO tables (restaurant_id, name, position) VALUES ($1,$2,$3)`,
        [restaurantId, `T${i}`, i]
      );
    }

    for (const m of data.menu) {
      const mr = await client.query(
        `INSERT INTO menu_items (restaurant_id, name, price_cents) VALUES ($1,$2,$3) RETURNING id`,
        [restaurantId, m.name, m.priceCents]
      );
      await client.query(
        `INSERT INTO stock_levels (menu_item_id, restaurant_id, quantity) VALUES ($1,$2,$3)`,
        [mr.rows[0].id, restaurantId, m.stock]
      );
    }

    if (data.platforms?.deliveryHeroToken) {
      const e = encrypt(data.platforms.deliveryHeroToken);
      for (const p of ["talabat", "instashop"]) {
        await client.query(
          `INSERT INTO platform_credentials (restaurant_id, platform, encrypted_token, iv, auth_tag)
           VALUES ($1,$2,$3,$4,$5)`,
          [restaurantId, p, e.encrypted, e.iv, e.authTag]
        );
      }
    }
    if (data.platforms?.deliverooToken) {
      const e = encrypt(data.platforms.deliverooToken);
      await client.query(
        `INSERT INTO platform_credentials (restaurant_id, platform, encrypted_token, iv, auth_tag)
         VALUES ($1,'deliveroo',$2,$3,$4)`,
        [restaurantId, e.encrypted, e.iv, e.authTag]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (restaurant_id, action, meta) VALUES ($1,'setup.complete',$2)`,
      [restaurantId, { tables: data.restaurant.tableCount, menu: data.menu.length, staff: data.staff.length }]
    );

    await client.query("COMMIT");
    res.json({ restaurantId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "setup_failed", message: e.message });
  } finally {
    client.release();
  }
});
