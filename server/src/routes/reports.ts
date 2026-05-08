import { Router } from "express";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";

export const reportsRouter = Router();
reportsRouter.use(requireAuth, requireRole("owner", "manager"));

reportsRouter.get("/daily", async (req, res) => {
  const rid = req.auth!.rid;
  const platforms = await query(
    `SELECT o.platform, SUM(o.total_cents) AS gross
     FROM orders o WHERE o.restaurant_id=$1 AND o.placed_at::date = CURRENT_DATE
     GROUP BY o.platform`,
    [rid]
  );
  const tills = await query(
    `SELECT method, SUM(amount_cents) AS total
     FROM payment_records WHERE restaurant_id=$1 AND recorded_at::date = CURRENT_DATE
     GROUP BY method`,
    [rid]
  );
  const commissions = await query(
    `SELECT platform, commission_rate FROM platform_credentials WHERE restaurant_id=$1`,
    [rid]
  );
  const rateMap = new Map(commissions.rows.map((r) => [r.platform, Number(r.commission_rate)]));

  const byPlatform = platforms.rows.map((p) => {
    const rate = rateMap.get(p.platform) ?? 0;
    const gross = Number(p.gross);
    const commission = Math.round(gross * rate);
    return { platform: p.platform, gross, commission, net: gross - commission, rate };
  });

  res.json({
    byPlatform,
    tills: tills.rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.method] = Number(r.total);
      return acc;
    }, {}),
  });
});
