import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";
import { platformSyncQueue } from "../queues";

export const menuRouter = Router();
menuRouter.use(requireAuth);

menuRouter.get("/", async (req, res) => {
  const r = await query(
    `SELECT m.id, m.name, m.price_cents, m.category, m.available, m.low_stock_threshold,
            COALESCE(s.quantity, 0) AS stock
     FROM menu_items m LEFT JOIN stock_levels s ON s.menu_item_id = m.id
     WHERE m.restaurant_id=$1 ORDER BY m.category, m.name`,
    [req.auth!.rid]
  );
  res.json(r.rows);
});

const upsert = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().min(0),
  category: z.string().default("Mains"),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  available: z.boolean().default(true),
});

menuRouter.post("/", requireRole("owner", "manager"), async (req, res) => {
  const p = upsert.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "bad_input" });
  const ins = await query(
    `INSERT INTO menu_items (restaurant_id, name, price_cents, category, available, low_stock_threshold)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.auth!.rid, p.data.name, p.data.priceCents, p.data.category, p.data.available, p.data.lowStockThreshold]
  );
  await query(`INSERT INTO stock_levels (menu_item_id, restaurant_id, quantity) VALUES ($1,$2,$3)`, [
    ins.rows[0].id,
    req.auth!.rid,
    p.data.stock,
  ]);
  await audit(req, "menu.create", { id: ins.rows[0].id });
  res.json({ id: ins.rows[0].id });
});

menuRouter.patch("/:id/availability", requireRole("owner", "manager"), async (req, res) => {
  const available = !!req.body?.available;
  await query(`UPDATE menu_items SET available=$1 WHERE id=$2 AND restaurant_id=$3`, [
    available,
    req.params.id,
    req.auth!.rid,
  ]);
  await platformSyncQueue.add("availability", {
    restaurantId: req.auth!.rid,
    menuItemId: req.params.id,
    available,
  });
  await audit(req, "menu.availability", { id: req.params.id, available });
  res.json({ ok: true });
});

menuRouter.patch("/:id/stock", requireRole("owner", "manager"), async (req, res) => {
  const qty = Number(req.body?.quantity);
  if (!Number.isFinite(qty) || qty < 0) return res.status(400).json({ error: "bad_input" });
  await query(
    `UPDATE stock_levels SET quantity=$1, updated_at=now() WHERE menu_item_id=$2 AND restaurant_id=$3`,
    [qty, req.params.id, req.auth!.rid]
  );
  await audit(req, "stock.adjust", { id: req.params.id, qty });
  res.json({ ok: true });
});
