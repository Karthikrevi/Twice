import { Pool, type QueryResultRow } from "pg";
import { env } from "../env";

export const pool = new Pool({ connectionString: env.databaseUrl });

export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
) {
  return pool.query<T>(text, params);
}

export async function withRestaurant<T>(restaurantId: string, fn: (q: typeof query) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL once.restaurant_id = $1", [restaurantId]);
    const scoped = ((text: string, params: any[] = []) => client.query(text, params)) as typeof query;
    const result = await fn(scoped);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
