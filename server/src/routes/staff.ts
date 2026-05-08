import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";

export const staffRouter = Router();
staffRouter.use(requireAuth, requireRole("owner"));

staffRouter.get("/", async (req, res) => {
  const r = await query(
    `SELECT id, name, email, role, created_at FROM users WHERE restaurant_id=$1 ORDER BY created_at`,
    [req.auth!.rid]
  );
  res.json(r.rows);
});

const create = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["manager", "waiter", "kitchen"]),
});

staffRouter.post("/", async (req, res) => {
  const p = create.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "bad_input" });
  const hash = await bcrypt.hash(p.data.password, 10);
  const r = await query(
    `INSERT INTO users (restaurant_id, email, password_hash, name, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [req.auth!.rid, p.data.email, hash, p.data.name, p.data.role]
  );
  await audit(req, "staff.create", { id: r.rows[0].id, role: p.data.role });
  res.json({ id: r.rows[0].id });
});

staffRouter.delete("/:id", async (req, res) => {
  await query(`DELETE FROM users WHERE id=$1 AND restaurant_id=$2 AND role <> 'owner'`, [
    req.params.id,
    req.auth!.rid,
  ]);
  await audit(req, "staff.delete", { id: req.params.id });
  res.json({ ok: true });
});

staffRouter.post("/:id/reset-password", async (req, res) => {
  const password = String(req.body?.password ?? "");
  if (password.length < 6) return res.status(400).json({ error: "weak_password" });
  const hash = await bcrypt.hash(password, 10);
  await query(`UPDATE users SET password_hash=$1 WHERE id=$2 AND restaurant_id=$3`, [
    hash,
    req.params.id,
    req.auth!.rid,
  ]);
  await audit(req, "staff.reset_password", { id: req.params.id });
  res.json({ ok: true });
});
