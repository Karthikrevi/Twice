import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db/pool";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "bad_input" });
  const { email, password } = parsed.data;

  const r = await query(
    `SELECT u.id, u.password_hash, u.role, u.restaurant_id, u.name FROM users u WHERE u.email=$1 LIMIT 1`,
    [email]
  );
  const user = r.rows[0];
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const payload = { uid: user.id, rid: user.restaurant_id, role: user.role };
  res.json({
    user: { id: user.id, name: user.name, email, role: user.role },
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  });
});

authRouter.post("/refresh", (req, res) => {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) return res.status(400).json({ error: "missing_token" });
  try {
    const p = verifyRefresh(token);
    res.json({ accessToken: signAccess({ uid: p.uid, rid: p.rid, role: p.role }) });
  } catch {
    res.status(401).json({ error: "invalid_refresh" });
  }
});
