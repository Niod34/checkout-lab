CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  price_cents   INTEGER NOT NULL,
  stock         INTEGER NOT NULL,
  weight_grams  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  code                TEXT    PRIMARY KEY,
  type                TEXT    NOT NULL CHECK (type IN ('PERCENT', 'FIXED')),
  value               INTEGER NOT NULL,
  min_subtotal_cents  INTEGER NOT NULL DEFAULT 0,
  max_discount_cents  INTEGER,
  expires_at          TEXT,
  active              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS carts (
  id          TEXT PRIMARY KEY,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  cart_id     TEXT    NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT    PRIMARY KEY,
  customer_name    TEXT    NOT NULL,
  customer_email   TEXT    NOT NULL,
  cep              TEXT    NOT NULL,
  items_json       TEXT    NOT NULL,
  quote_json       TEXT    NOT NULL,
  created_at       TEXT    NOT NULL
);
