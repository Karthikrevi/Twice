import { Router } from "express";
import { query } from "../db/pool";
import { requireAuth, requireRole } from "../middleware/auth";
import { audit } from "../middleware/audit";

export const privacyRouter = Router();

// Bump this string when the policy text changes — recorded against each
// user's consent row so we know exactly which version they accepted.
export const PRIVACY_POLICY_VERSION = "2026-05-13";

/**
 * POST /privacy/export-data — Article 13 PDPL data subject access.
 *
 * Returns everything Once holds keyed off the authenticated user_id.
 * Owners optionally see the restaurant-level rows their account drove
 * (so a single export covers the full owner picture). Bounded to the
 * user's own restaurant_id — never crosses tenants.
 */
privacyRouter.post("/export-data", requireAuth, async (req, res) => {
  const { uid, rid, role } = req.auth!;

  const userRow = await query(
    `SELECT id, email, name, role, consent_given, consent_date, consent_version, created_at
       FROM users WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [uid, rid]
  );

  const sessionsOpened = await query(
    `SELECT id, table_id, guests, opened_at, closed_at, payment_method, total_cents
       FROM table_sessions
      WHERE restaurant_id = $1 AND opened_by = $2
      ORDER BY opened_at DESC`,
    [rid, uid]
  );

  const paymentsRecorded = await query(
    `SELECT id, table_session_id, order_id, method, amount_cents, recorded_at
       FROM payment_records
      WHERE restaurant_id = $1 AND recorded_by = $2
      ORDER BY recorded_at DESC`,
    [rid, uid]
  );

  const orderActions = await query(
    `SELECT order_id, from_status, to_status, changed_at
       FROM order_status_history
      WHERE restaurant_id = $1 AND changed_by = $2
      ORDER BY changed_at DESC`,
    [rid, uid]
  );

  const auditEntries = await query(
    `SELECT id, action, meta, created_at
       FROM audit_logs
      WHERE restaurant_id = $1 AND user_id = $2
      ORDER BY created_at DESC`,
    [rid, uid]
  );

  // Owners get the restaurant-level rollup attached.
  let restaurantSummary: unknown = null;
  let ownerOrders: unknown = null;
  if (role === "owner") {
    const r = await query(
      `SELECT id, name, location, kitchen_output, table_count, deleted_at, created_at
         FROM restaurants WHERE id = $1 LIMIT 1`,
      [rid]
    );
    restaurantSummary = r.rows[0] ?? null;
    const o = await query(
      `SELECT id, short_id, platform, status, customer_name, total_cents, placed_at
         FROM orders WHERE restaurant_id = $1 ORDER BY placed_at DESC LIMIT 5000`,
      [rid]
    );
    ownerOrders = o.rows;
  }

  await audit(req, "privacy.export_data", { user_id: uid });

  const filename = `once-data-export-${uid.slice(0, 8)}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        policy_version: PRIVACY_POLICY_VERSION,
        subject: userRow.rows[0] ?? null,
        sessions_opened: sessionsOpened.rows,
        payments_recorded: paymentsRecorded.rows,
        order_status_changes: orderActions.rows,
        audit_log: auditEntries.rows,
        restaurant: restaurantSummary,
        orders: ownerOrders,
      },
      null,
      2
    )
  );
});

/**
 * POST /privacy/delete-account — Article 16 PDPL erasure.
 *
 * Owner-only. Anonymizes every user in the restaurant and marks the
 * restaurant as deleted. Order records are retained for UAE financial
 * compliance (Federal Tax Authority requires 5y) but personal
 * identifiers are stripped.
 */
privacyRouter.post(
  "/delete-account",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const { rid, uid } = req.auth!;

    // Email column has UNIQUE (restaurant_id, email) so we suffix with
    // the user id to keep the constraint satisfied after anonymization.
    await query(
      `UPDATE users
         SET name = 'Deleted User',
             email = 'deleted+' || SUBSTRING(id::text, 1, 8) || '@once.app',
             password_hash = NULL,
             google_id = NULL
       WHERE restaurant_id = $1`,
      [rid]
    );

    // Strip customer identifiers from orders (retain financial rows).
    await query(
      `UPDATE orders
         SET customer_name = NULL,
             delivery_address = NULL,
             special_instructions = NULL
       WHERE restaurant_id = $1`,
      [rid]
    );

    // Mark restaurant deleted.
    await query(
      `UPDATE restaurants SET deleted_at = now() WHERE id = $1`,
      [rid]
    );

    await audit(req, "privacy.delete_account", { user_id: uid });
    res.json({ ok: true });
  }
);

/**
 * GET /privacy/policy — public version document.
 */
privacyRouter.get("/policy", (_req, res) => {
  res.json({
    version: PRIVACY_POLICY_VERSION,
    last_updated: PRIVACY_POLICY_VERSION,
    jurisdiction: "United Arab Emirates",
    framework: "UAE Federal Decree-Law No. 45/2021 (PDPL)",
    contact: "privacy@once.app",
    breach_notification_window_hours: 72,
    rights: [
      "access",
      "rectification",
      "erasure",
      "restriction",
      "data_portability",
      "objection",
    ],
  });
});
