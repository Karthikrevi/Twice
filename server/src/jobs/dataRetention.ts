import * as Sentry from "@sentry/node";
import { query } from "../db/pool";

/**
 * Data retention sweep — runs daily via BullMQ. Defaults to the
 * UAE PDPL Article 18 guidance plus the Federal Tax Authority's
 * 5-year retention on tax invoices; per-restaurant overrides live in
 * the `data_retention_config` table.
 *
 *   orders            > order_days   → DELETE   (with FK cascade)
 *   closed sessions   > session_days → anonymize (opened_by → NULL,
 *                                     payment_records.recorded_by → NULL)
 *   audit_logs        > audit_days   → DELETE
 *
 * The env-level fallbacks below apply when a restaurant has no
 * data_retention_config row.
 */

const FALLBACK_ORDER_DAYS = Number(process.env.DATA_RETENTION_ORDER_DAYS ?? 730);
const FALLBACK_SESSION_DAYS = Number(process.env.DATA_RETENTION_SESSION_DAYS ?? 365);
const FALLBACK_AUDIT_DAYS = Number(process.env.DATA_RETENTION_AUDIT_DAYS ?? 1095);

export interface RetentionStats {
  scanned_restaurants: number;
  orders_deleted: number;
  sessions_anonymized: number;
  audit_logs_deleted: number;
}

export async function runDataRetention(): Promise<RetentionStats> {
  const stats: RetentionStats = {
    scanned_restaurants: 0,
    orders_deleted: 0,
    sessions_anonymized: 0,
    audit_logs_deleted: 0,
  };

  try {
    const restaurants = await query<{
      id: string;
      order_days: number | null;
      session_days: number | null;
      audit_days: number | null;
    }>(
      `SELECT r.id,
              c.order_days,
              c.session_days,
              c.audit_days
         FROM restaurants r
         LEFT JOIN data_retention_config c ON c.restaurant_id = r.id`
    );

    for (const r of restaurants.rows) {
      stats.scanned_restaurants++;
      const orderDays = r.order_days ?? FALLBACK_ORDER_DAYS;
      const sessionDays = r.session_days ?? FALLBACK_SESSION_DAYS;
      const auditDays = r.audit_days ?? FALLBACK_AUDIT_DAYS;

      // 1. delete old orders (cascade wipes order_items + status_history)
      const deletedOrders = await query(
        `DELETE FROM orders
           WHERE restaurant_id = $1
             AND placed_at < now() - ($2 || ' days')::interval`,
        [r.id, orderDays]
      );
      stats.orders_deleted += deletedOrders.rowCount ?? 0;

      // 2. anonymize closed sessions older than session_days
      const anonSessions = await query(
        `UPDATE table_sessions
            SET opened_by = NULL
          WHERE restaurant_id = $1
            AND closed_at IS NOT NULL
            AND closed_at < now() - ($2 || ' days')::interval
            AND opened_by IS NOT NULL`,
        [r.id, sessionDays]
      );
      stats.sessions_anonymized += anonSessions.rowCount ?? 0;
      await query(
        `UPDATE payment_records
            SET recorded_by = NULL
          WHERE restaurant_id = $1
            AND recorded_at < now() - ($2 || ' days')::interval
            AND recorded_by IS NOT NULL`,
        [r.id, sessionDays]
      );

      // 3. purge audit logs older than audit_days
      const deletedAudit = await query(
        `DELETE FROM audit_logs
           WHERE restaurant_id = $1
             AND created_at < now() - ($2 || ' days')::interval`,
        [r.id, auditDays]
      );
      stats.audit_logs_deleted += deletedAudit.rowCount ?? 0;
    }

    console.log(
      `[data-retention] swept ${stats.scanned_restaurants} restaurants — ` +
        `deleted ${stats.orders_deleted} orders, anonymized ${stats.sessions_anonymized} ` +
        `sessions, deleted ${stats.audit_logs_deleted} audit rows`
    );
    return stats;
  } catch (err) {
    Sentry.captureException(err, { tags: { kind: "data-retention" } });
    throw err;
  }
}
