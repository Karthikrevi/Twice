import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool";

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("✓ Schema applied");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
