import type { Request } from "express";
import { query } from "../db/pool";

export async function audit(req: Request, action: string, meta: Record<string, unknown> = {}) {
  if (!req.auth) return;
  await query(
    `INSERT INTO audit_logs (restaurant_id, user_id, action, meta) VALUES ($1,$2,$3,$4)`,
    [req.auth.rid, req.auth.uid, action, meta]
  );
}
