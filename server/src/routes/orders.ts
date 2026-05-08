import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";
import { emitToRestaurant } from "../realtime/io";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req, res) => {
  const { rid, role, uid } = req.auth!;
  let sql = `SELECT o.*, COALESCE(json_agg(json_build_object(
              'id', oi.id, 'name', oi.name_snapshot, 'qty', oi.qty, 'priceCents', oi.price_cents
            )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
            FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
            WHERE o.restaurant_id=$1`;
  const params: any[] = [rid];
  if (role === "waiter") {
    sql += ` AND o.platform='dinein' AND o.table_id IN (
              SELECT table_id FROM table_sessions WHERE opened_by=$2 AND closed_at IS NULL)`;
    params.push(uid);
  }
  sql += ` GROUP BY o.id ORDER BY o.placed_at DESC LIMIT 200`;
  const r = await query(sql, params);
  res.json(r.rows);
});

const statusSchema = z.object({ status: z.enum(["new", "preparing", "ready", "done"]) });

ordersRouter.patch("/:id/status", requireRole("owner", "manager"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });

  const cur = await query(`SELECT status FROM orders WHERE id=$1 AND restaurant_id=$2`, [
    req.params.id,
    req.auth!.rid,
  ]);
  if (!cur.rowCount) return res.status(404).json({ error: "not_found" });

  await query(`UPDATE orders SET status=$1 WHERE id=$2`, [parsed.data.status, req.params.id]);
  await query(
    `INSERT INTO order_status_history (restaurant_id, order_id, from_status, to_status, changed_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [req.auth!.rid, req.params.id, cur.rows[0].status, parsed.data.status, req.auth!.uid]
  );
  await audit(req, "order.status_changed", { id: req.params.id, to: parsed.data.status });

  emitToRestaurant(req.auth!.rid, "order:status", { id: req.params.id, status: parsed.data.status });
  res.json({ ok: true });
});
