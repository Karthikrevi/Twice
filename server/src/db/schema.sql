-- Once — full schema. Every domain table is scoped by restaurant_id.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS restaurants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  location        text NOT NULL,
  kitchen_output  text NOT NULL CHECK (kitchen_output IN ('screen','printer')),
  table_count     int  NOT NULL DEFAULT 0,
  setup_complete  boolean NOT NULL DEFAULT false,
  owner_pin_hash  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_pin_hash text;

CREATE TABLE IF NOT EXISTS roles (
  id    serial PRIMARY KEY,
  name  text UNIQUE NOT NULL
);
INSERT INTO roles (name) VALUES ('owner'),('manager'),('waiter'),('kitchen')
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email           text NOT NULL,
  password_hash   text NOT NULL,
  name            text NOT NULL,
  role            text NOT NULL REFERENCES roles(name),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, email)
);
CREATE INDEX IF NOT EXISTS users_restaurant_idx ON users(restaurant_id);

CREATE TABLE IF NOT EXISTS staff_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL REFERENCES roles(name),
  token           text NOT NULL,
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  price_cents     int  NOT NULL,
  category        text NOT NULL DEFAULT 'Mains',
  available       boolean NOT NULL DEFAULT true,
  low_stock_threshold int NOT NULL DEFAULT 5,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS menu_restaurant_idx ON menu_items(restaurant_id);

CREATE TABLE IF NOT EXISTS stock_levels (
  menu_item_id    uuid PRIMARY KEY REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  quantity        int  NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platforms (
  id              serial PRIMARY KEY,
  name            text UNIQUE NOT NULL
);
INSERT INTO platforms (name) VALUES ('talabat'),('deliveroo'),('instashop'),('dinein'),('takeaway')
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS platform_credentials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  platform        text NOT NULL REFERENCES platforms(name),
  encrypted_token bytea NOT NULL,
  iv              bytea NOT NULL,
  auth_tag        bytea NOT NULL,
  commission_rate numeric(5,4) NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'connected',
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, platform)
);

CREATE TABLE IF NOT EXISTS tables (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  position        int  NOT NULL,
  UNIQUE (restaurant_id, name)
);

CREATE TABLE IF NOT EXISTS table_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id        uuid NOT NULL REFERENCES tables(id),
  guests          int  NOT NULL DEFAULT 1,
  opened_by       uuid REFERENCES users(id),
  opened_at       timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  payment_method  text CHECK (payment_method IN ('cash','card','wallet')),
  total_cents     int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS table_session_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  session_id      uuid NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  menu_item_id    uuid REFERENCES menu_items(id),
  name_snapshot   text NOT NULL,
  qty             int NOT NULL,
  price_cents     int NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id       uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  short_id            text NOT NULL,
  platform            text NOT NULL REFERENCES platforms(name),
  external_id         text,
  status              text NOT NULL CHECK (status IN ('new','preparing','ready','done')),
  customer_name       text,
  delivery_address    text,
  table_id            uuid REFERENCES tables(id),
  special_instructions text,
  total_cents         int NOT NULL DEFAULT 0,
  placed_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, platform, external_id)
);
CREATE INDEX IF NOT EXISTS orders_restaurant_status_idx ON orders(restaurant_id, status);

CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    uuid REFERENCES menu_items(id),
  name_snapshot   text NOT NULL,
  qty             int NOT NULL,
  price_cents     int NOT NULL,
  notes           text
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status     text,
  to_status       text NOT NULL,
  changed_by      uuid REFERENCES users(id),
  changed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_session_id uuid REFERENCES table_sessions(id),
  order_id        uuid REFERENCES orders(id),
  method          text NOT NULL CHECK (method IN ('cash','card','wallet')),
  amount_cents    int NOT NULL,
  recorded_by     uuid REFERENCES users(id),
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  platform        text NOT NULL REFERENCES platforms(name),
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  gross_cents     int NOT NULL,
  commission_cents int NOT NULL,
  net_cents       int NOT NULL,
  reconciled_at   timestamptz
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  token_hash      text NOT NULL,
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prt_user_idx ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id),
  action          text NOT NULL,
  meta            jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_restaurant_time_idx ON audit_logs(restaurant_id, created_at DESC);
