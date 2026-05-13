import bcrypt from "bcryptjs";
import { pool } from "./pool";
import { encrypt } from "../lib/crypto";

/* ------------------------------------------------------------------------- */
/*  Once seed — Al Mandi House (Jumeirah, Dubai)                             */
/* ------------------------------------------------------------------------- */
/*  Idempotent: deletes any pre-existing 'Al Mandi House' restaurant first   */
/*  (FK CASCADE wipes users, menu, orders, sessions, etc.) and rebuilds.     */
/* ------------------------------------------------------------------------- */

const RESTAURANT_NAME = "Al Mandi House";
const LOCATION = "Jumeirah, Dubai";
const KITCHEN_OUTPUT = "screen";
const TABLE_COUNT = 12;

const OWNER = {
  name: "Test Owner",
  email: "owner@test.com",
  password: "test1234",
  pin: "1234",
};

const STAFF = [
  { name: "Test Manager", email: "manager@test.com", password: "test1234", role: "manager" },
  { name: "Test Waiter 1", email: "waiter1@test.com", password: "test1234", role: "waiter" },
  { name: "Test Waiter 2", email: "waiter2@test.com", password: "test1234", role: "waiter" },
  { name: "Test Kitchen", email: "kitchen@test.com", password: "test1234", role: "kitchen" },
];

const MENU: { name: string; price: number; stock: number; category: string }[] = [
  // Mains
  { name: "Lamb Mandi", price: 65, stock: 20, category: "Mains" },
  { name: "Chicken Mandi", price: 45, stock: 25, category: "Mains" },
  { name: "Mixed Grill", price: 89, stock: 15, category: "Mains" },
  { name: "Grilled Hammour", price: 120, stock: 10, category: "Mains" },
  { name: "Chicken Shawarma", price: 22, stock: 40, category: "Mains" },
  // Starters
  { name: "Hummus", price: 18, stock: 30, category: "Starters" },
  { name: "Fattoush", price: 16, stock: 25, category: "Starters" },
  { name: "Mutabal", price: 18, stock: 20, category: "Starters" },
  { name: "Soup of the Day", price: 22, stock: 15, category: "Starters" },
  // Beverages
  { name: "Karak Tea", price: 8, stock: 50, category: "Beverages" },
  { name: "Fresh Lemon Mint", price: 12, stock: 40, category: "Beverages" },
  { name: "Mango Juice", price: 15, stock: 30, category: "Beverages" },
  { name: "Water", price: 5, stock: 100, category: "Beverages" },
  // Desserts
  { name: "Umm Ali", price: 25, stock: 12, category: "Desserts" },
  { name: "Luqaimat", price: 20, stock: 15, category: "Desserts" },
];

const PLATFORM_CREDS: {
  platform: "talabat" | "deliveroo" | "instashop";
  commission_rate: number;
  token: string;
}[] = [
  { platform: "talabat", commission_rate: 0.25, token: "dh_vendor_test_talabat_sandbox" },
  { platform: "deliveroo", commission_rate: 0.28, token: "deliveroo_test_sandbox" },
  { platform: "instashop", commission_rate: 0.22, token: "dh_vendor_test_instashop_sandbox" },
];

const CUSTOMERS = [
  "Ahmed Al Maktoum",
  "Fatima Hassan",
  "Khalid Al Nasser",
  "Layla Ibrahim",
  "Omar Saleem",
  "Mariam Ali",
  "Yusuf Khan",
  "Aisha Al Said",
  "Hamad Al Rashid",
  "Noura Al Falasi",
  "Saif Al Maktoum",
  "Reem Al Hashimi",
];

const ADDRESSES = [
  "Jumeirah 1, Villa 22",
  "Downtown, Burj Vista T2 1801",
  "Al Barsha 2, Building 7",
  "JLT, Cluster N, Apt 1205",
  "Marina, Le Reve 3402",
  "Mirdif, Uptown Villa 12",
  "Al Wasl Road, Townhouse 9",
];

const SPECIAL_NOTES = [
  "No onions",
  "Extra spicy",
  "Allergic to nuts",
  "Well-done please",
  "No coriander",
];

interface MenuLookup {
  id: string;
  name: string;
  price_cents: number;
}

/* ------------------------------------------------------------------------- */

async function main() {
  console.log("→ Connecting…");
  const client = await pool.connect();

  try {
    console.log(`→ Clearing any prior '${RESTAURANT_NAME}' restaurant (CASCADE)`);
    await client.query(`DELETE FROM restaurants WHERE name = $1`, [RESTAURANT_NAME]);

    await client.query("BEGIN");

    /* ---------- restaurant ---------- */
    console.log(`→ Creating restaurant '${RESTAURANT_NAME}' (${LOCATION})`);
    const ownerPinHash = await bcrypt.hash(OWNER.pin, 10);
    const restaurantInsert = await client.query<{ id: string }>(
      `INSERT INTO restaurants
         (name, location, kitchen_output, table_count, setup_complete, owner_pin_hash)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING id`,
      [RESTAURANT_NAME, LOCATION, KITCHEN_OUTPUT, TABLE_COUNT, ownerPinHash]
    );
    const restaurantId = restaurantInsert.rows[0].id;

    /* ---------- users ---------- */
    console.log(`→ Creating owner ${OWNER.email}`);
    const ownerHash = await bcrypt.hash(OWNER.password, 10);
    await client.query(
      `INSERT INTO users (restaurant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'owner')`,
      [restaurantId, OWNER.email, ownerHash, OWNER.name]
    );

    for (const s of STAFF) {
      console.log(`→ Creating ${s.role} ${s.email}`);
      const hash = await bcrypt.hash(s.password, 10);
      await client.query(
        `INSERT INTO users (restaurant_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        [restaurantId, s.email, hash, s.name, s.role]
      );
    }

    /* ---------- menu + stock ---------- */
    console.log(`→ Seeding ${MENU.length} menu items`);
    const menuByName = new Map<string, MenuLookup>();
    for (const m of MENU) {
      const priceCents = Math.round(m.price * 100);
      const mr = await client.query<{ id: string }>(
        `INSERT INTO menu_items (restaurant_id, name, price_cents, category, available, low_stock_threshold)
         VALUES ($1, $2, $3, $4, true, 5)
         RETURNING id`,
        [restaurantId, m.name, priceCents, m.category]
      );
      const id = mr.rows[0].id;
      menuByName.set(m.name, { id, name: m.name, price_cents: priceCents });
      await client.query(
        `INSERT INTO stock_levels (menu_item_id, restaurant_id, quantity) VALUES ($1, $2, $3)`,
        [id, restaurantId, m.stock]
      );
    }

    /* ---------- tables ---------- */
    console.log(`→ Creating ${TABLE_COUNT} tables (T1–T${TABLE_COUNT})`);
    const tablesById = new Map<string, string>(); // name → id
    for (let i = 1; i <= TABLE_COUNT; i++) {
      const tr = await client.query<{ id: string }>(
        `INSERT INTO tables (restaurant_id, name, position) VALUES ($1, $2, $3) RETURNING id`,
        [restaurantId, `T${i}`, i]
      );
      tablesById.set(`T${i}`, tr.rows[0].id);
    }

    /* ---------- platform credentials ---------- */
    console.log("→ Adding platform credentials (encrypted)");
    for (const p of PLATFORM_CREDS) {
      const e = encrypt(p.token);
      await client.query(
        `INSERT INTO platform_credentials
           (restaurant_id, platform, encrypted_token, iv, auth_tag, commission_rate, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'connected')`,
        [restaurantId, p.platform, e.encrypted, e.iv, e.authTag, p.commission_rate]
      );
    }

    /* ---------- open table sessions ---------- */
    console.log("→ Opening 4 dine-in sessions (T3, T5, T7, T9)");
    const openSessions: Record<
      string,
      { sessionId: string; tableId: string; guests: number; items: string[] }
    > = {
      T3: { sessionId: "", tableId: tablesById.get("T3")!, guests: 4, items: ["Lamb Mandi", "Fattoush", "Karak Tea", "Karak Tea", "Karak Tea", "Karak Tea"] },
      T5: { sessionId: "", tableId: tablesById.get("T5")!, guests: 2, items: ["Mixed Grill", "Mango Juice", "Mango Juice"] },
      T7: { sessionId: "", tableId: tablesById.get("T7")!, guests: 5, items: ["Chicken Mandi", "Chicken Mandi", "Hummus", "Fresh Lemon Mint", "Fresh Lemon Mint", "Umm Ali"] },
      T9: { sessionId: "", tableId: tablesById.get("T9")!, guests: 3, items: ["Grilled Hammour", "Mutabal", "Water", "Water", "Luqaimat"] },
    };
    for (const [name, s] of Object.entries(openSessions)) {
      const total = s.items.reduce(
        (sum, n) => sum + (menuByName.get(n)?.price_cents ?? 0),
        0
      );
      const minutesOpen = 20 + Math.floor(Math.random() * 60);
      const openedAt = new Date(Date.now() - minutesOpen * 60_000);
      const sr = await client.query<{ id: string }>(
        `INSERT INTO table_sessions (restaurant_id, table_id, guests, opened_at, total_cents)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [restaurantId, s.tableId, s.guests, openedAt, total]
      );
      s.sessionId = sr.rows[0].id;
      for (const itemName of s.items) {
        const m = menuByName.get(itemName);
        if (!m) continue;
        await client.query(
          `INSERT INTO table_session_items
             (restaurant_id, session_id, menu_item_id, name_snapshot, qty, price_cents)
           VALUES ($1, $2, $3, $4, 1, $5)`,
          [restaurantId, s.sessionId, m.id, m.name, m.price_cents]
        );
      }
      console.log(`   ${name} · ${s.guests} guests · AED ${total / 100}`);
    }

    /* ---------- orders (20, spread through the day) ---------- */
    console.log("→ Creating 20 orders across all platforms");
    type Status = "new" | "preparing" | "ready" | "done";
    type Platform = "talabat" | "deliveroo" | "instashop" | "dinein" | "takeaway";

    interface Spec {
      platform: Platform;
      status: Status;
      minutesAgo: number;
      items: { name: string; qty: number }[];
      customer?: string;
      address?: string;
      tableName?: keyof typeof openSessions;
      note?: string;
    }

    const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const specs: Spec[] = [
      // — Done (5)
      { platform: "talabat", status: "done", minutesAgo: 320, items: [{ name: "Chicken Shawarma", qty: 2 }, { name: "Hummus", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "deliveroo", status: "done", minutesAgo: 280, items: [{ name: "Lamb Mandi", qty: 1 }, { name: "Mango Juice", qty: 2 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "dinein", status: "done", minutesAgo: 240, items: [{ name: "Mixed Grill", qty: 1 }, { name: "Fattoush", qty: 1 }], tableName: "T3" },
      { platform: "takeaway", status: "done", minutesAgo: 200, items: [{ name: "Chicken Mandi", qty: 1 }], customer: "Walk-in" },
      { platform: "instashop", status: "done", minutesAgo: 180, items: [{ name: "Karak Tea", qty: 4 }, { name: "Luqaimat", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },

      // — Ready (5)
      { platform: "talabat", status: "ready", minutesAgo: 22, items: [{ name: "Mixed Grill", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES), note: rand(SPECIAL_NOTES) },
      { platform: "dinein", status: "ready", minutesAgo: 18, items: [{ name: "Grilled Hammour", qty: 1 }, { name: "Mutabal", qty: 1 }], tableName: "T9" },
      { platform: "deliveroo", status: "ready", minutesAgo: 14, items: [{ name: "Chicken Shawarma", qty: 3 }, { name: "Fresh Lemon Mint", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "instashop", status: "ready", minutesAgo: 12, items: [{ name: "Lamb Mandi", qty: 1 }, { name: "Hummus", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "takeaway", status: "ready", minutesAgo: 9, items: [{ name: "Umm Ali", qty: 2 }], customer: "Walk-in" },

      // — Preparing (5)
      { platform: "dinein", status: "preparing", minutesAgo: 11, items: [{ name: "Chicken Mandi", qty: 2 }, { name: "Hummus", qty: 1 }, { name: "Fresh Lemon Mint", qty: 2 }], tableName: "T7", note: "No onions" },
      { platform: "talabat", status: "preparing", minutesAgo: 8, items: [{ name: "Fattoush", qty: 2 }, { name: "Mixed Grill", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "deliveroo", status: "preparing", minutesAgo: 7, items: [{ name: "Lamb Mandi", qty: 1 }, { name: "Karak Tea", qty: 2 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "instashop", status: "preparing", minutesAgo: 6, items: [{ name: "Chicken Shawarma", qty: 4 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "dinein", status: "preparing", minutesAgo: 5, items: [{ name: "Mixed Grill", qty: 1 }, { name: "Mango Juice", qty: 2 }], tableName: "T5" },

      // — New (5)
      { platform: "talabat", status: "new", minutesAgo: 4, items: [{ name: "Chicken Shawarma", qty: 2 }, { name: "Karak Tea", qty: 2 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES), note: "Allergic to nuts" },
      { platform: "deliveroo", status: "new", minutesAgo: 3, items: [{ name: "Umm Ali", qty: 1 }, { name: "Luqaimat", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "instashop", status: "new", minutesAgo: 2, items: [{ name: "Mango Juice", qty: 3 }, { name: "Soup of the Day", qty: 1 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
      { platform: "takeaway", status: "new", minutesAgo: 1, items: [{ name: "Chicken Mandi", qty: 1 }], customer: "Walk-in", note: "Extra spicy" },
      { platform: "talabat", status: "new", minutesAgo: 1, items: [{ name: "Grilled Hammour", qty: 1 }, { name: "Water", qty: 2 }], customer: rand(CUSTOMERS), address: rand(ADDRESSES) },
    ];

    const platformPrefix: Record<Platform, string> = {
      talabat: "TLB",
      deliveroo: "DLR",
      instashop: "INS",
      dinein: "DIN",
      takeaway: "TKW",
    };

    let counter = 1000;
    for (const spec of specs) {
      const total = spec.items.reduce((sum, it) => {
        const m = menuByName.get(it.name);
        return sum + (m ? m.price_cents * it.qty : 0);
      }, 0);
      const placedAt = new Date(Date.now() - spec.minutesAgo * 60_000);
      const tableId = spec.tableName ? openSessions[spec.tableName]?.tableId : null;
      counter += 1;
      const shortId = `#${platformPrefix[spec.platform]}-${counter}`;
      const externalId = spec.platform === "dinein" || spec.platform === "takeaway"
        ? `${spec.platform}-${counter}`
        : `${spec.platform.slice(0, 3)}-${counter}`;

      const or = await client.query<{ id: string }>(
        `INSERT INTO orders
           (restaurant_id, short_id, platform, external_id, status,
            customer_name, delivery_address, table_id, special_instructions,
            total_cents, placed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          restaurantId,
          shortId,
          spec.platform,
          externalId,
          spec.status,
          spec.customer ?? null,
          spec.address ?? null,
          tableId,
          spec.note ?? null,
          total,
          placedAt,
        ]
      );
      const orderId = or.rows[0].id;

      for (const it of spec.items) {
        const m = menuByName.get(it.name);
        if (!m) continue;
        await client.query(
          `INSERT INTO order_items
             (restaurant_id, order_id, menu_item_id, name_snapshot, qty, price_cents)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [restaurantId, orderId, m.id, m.name, it.qty, m.price_cents]
        );
      }

      await client.query(
        `INSERT INTO order_status_history (restaurant_id, order_id, from_status, to_status)
         VALUES ($1, $2, NULL, $3)`,
        [restaurantId, orderId, spec.status]
      );
    }

    await client.query("COMMIT");
    console.log("✓ Seed complete");
    console.log("");
    console.log("Sign in with:");
    console.log(`  Owner:    ${OWNER.email}    / ${OWNER.password}   (PIN ${OWNER.pin})`);
    STAFF.forEach((s) =>
      console.log(`  ${s.role.padEnd(8, " ")}: ${s.email.padEnd(20, " ")} / ${s.password}`)
    );
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error("✖ Seed failed:", err);
    pool.end();
    process.exit(1);
  });
