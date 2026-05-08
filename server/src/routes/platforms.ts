import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool";
import { encrypt } from "../lib/crypto";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";

export const platformsRouter = Router();
platformsRouter.use(requireAuth, requireRole("owner"));

platformsRouter.get("/", async (req, res) => {
  const r = await query(
    `SELECT platform, status, commission_rate, updated_at FROM platform_credentials WHERE restaurant_id=$1`,
    [req.auth!.rid]
  );
  res.json(r.rows);
});

const upsert = z.object({
  platform: z.enum(["talabat", "deliveroo", "instashop"]),
  token: z.string().min(8),
  commissionRate: z.number().min(0).max(1).optional(),
});

platformsRouter.post("/", async (req, res) => {
  const p = upsert.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "bad_input" });
  const e = encrypt(p.data.token);
  await query(
    `INSERT INTO platform_credentials (restaurant_id, platform, encrypted_token, iv, auth_tag, commission_rate)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (restaurant_id, platform) DO UPDATE
       SET encrypted_token = EXCLUDED.encrypted_token,
           iv = EXCLUDED.iv,
           auth_tag = EXCLUDED.auth_tag,
           commission_rate = EXCLUDED.commission_rate,
           status = 'connected',
           updated_at = now()`,
    [req.auth!.rid, p.data.platform, e.encrypted, e.iv, e.authTag, p.data.commissionRate ?? 0]
  );
  await audit(req, "platform.upsert", { platform: p.data.platform });
  res.json({ ok: true });
});

platformsRouter.delete("/:platform", async (req, res) => {
  await query(`DELETE FROM platform_credentials WHERE restaurant_id=$1 AND platform=$2`, [
    req.auth!.rid,
    req.params.platform,
  ]);
  await audit(req, "platform.disconnect", { platform: req.params.platform });
  res.json({ ok: true });
});
