import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";

export const tablesRouter = Router();
tablesRouter.use(requireAuth);

tablesRouter.get("/", async (req, res) => {
  const r = await query(
    `SELECT t.id, t.name, t.position,
       s.id AS session_id, s.guests, s.opened_at, s.total_cents
     FROM tables t
     LEFT JOIN table_sessions s ON s.table_id = t.id AND s.closed_at IS NULL
     WHERE t.restaurant_id=$1 ORDER BY t.position`,
    [req.auth!.rid]
  );
  res.json(r.rows);
});

tablesRouter.post("/:id/open", async (req, res) => {
  const guests = Number(req.body?.guests ?? 1);
  const r = await query(
    `INSERT INTO table_sessions (restaurant_id, table_id, guests, opened_by)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [req.auth!.rid, req.params.id, guests, req.auth!.uid]
  );
  await audit(req, "table.open", { id: req.params.id, guests });
  res.json({ sessionId: r.rows[0].id });
});

const itemSchema = z.object({
  menuItemId: z.string().uuid(),
  name: z.string(),
  qty: z.number().int().min(1),
  priceCents: z.number().int().min(0),
});

tablesRouter.post("/sessions/:sessionId/items", async (req, res) => {
  const p = itemSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "bad_input" });
  await query(
    `INSERT INTO table_session_items (restaurant_id, session_id, menu_item_id, name_snapshot, qty, price_cents)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.auth!.rid, req.params.sessionId, p.data.menuItemId, p.data.name, p.data.qty, p.data.priceCents]
  );
  await query(
    `UPDATE table_sessions SET total_cents = total_cents + $1 WHERE id=$2 AND restaurant_id=$3`,
    [p.data.priceCents * p.data.qty, req.params.sessionId, req.auth!.rid]
  );
  res.json({ ok: true });
});

const closeSchema = z.object({
  splits: z.array(
    z.object({ amountCents: z.number().int().min(0), method: z.enum(["cash", "card", "wallet"]) })
  ),
});

tablesRouter.post(
  "/sessions/:sessionId/close",
  requireRole("owner", "manager", "waiter"),
  async (req, res) => {
    const p = closeSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "bad_input" });

    for (const s of p.data.splits) {
      await query(
        `INSERT INTO payment_records (restaurant_id, table_session_id, method, amount_cents, recorded_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [req.auth!.rid, req.params.sessionId, s.method, s.amountCents, req.auth!.uid]
      );
    }
    await query(`UPDATE table_sessions SET closed_at=now() WHERE id=$1 AND restaurant_id=$2`, [
      req.params.sessionId,
      req.auth!.rid,
    ]);
    await audit(req, "table.close", { sessionId: req.params.sessionId });
    res.json({ ok: true });
  }
);
