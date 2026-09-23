import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { SEED_COUPONS, SEED_PRODUCTS } from './seed-data';
import type { Cart, CartItem, Coupon, Order, Product } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = process.env.DB_FILE ?? path.join(DATA_DIR, 'checkout-lab.db');

// Mantém uma única conexão mesmo com o hot reload do Next em desenvolvimento.
const globalForDb = globalThis as unknown as { db?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new DatabaseSync(DB_FILE);
    db.exec('PRAGMA foreign_keys = ON');
    db.exec(fs.readFileSync(path.join(process.cwd(), 'src/db/schema.sql'), 'utf8'));
    globalForDb.db = db;

    const { total } = db.prepare('SELECT COUNT(*) AS total FROM products').get() as {
      total: number;
    };
    if (total === 0) seed();
  }
  return globalForDb.db;
}

function one<T>(sql: string, ...params: SQLInputValue[]): T | null {
  return (
    (getDb()
      .prepare(sql)
      .get(...params) as unknown as T | undefined) ?? null
  );
}

function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return getDb()
    .prepare(sql)
    .all(...params) as unknown as T[];
}

function run(sql: string, ...params: SQLInputValue[]) {
  getDb()
    .prepare(sql)
    .run(...params);
}

export function seed() {
  const db = getDb();
  db.exec(`
    DELETE FROM cart_items; DELETE FROM carts; DELETE FROM orders;
    DELETE FROM products; DELETE FROM coupons;
  `);

  for (const p of SEED_PRODUCTS) {
    run(
      `INSERT INTO products (id, slug, name, description, price_cents, stock, weight_grams)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      p.slug,
      p.name,
      p.description,
      p.priceCents,
      p.stock,
      p.weightGrams,
    );
  }

  for (const c of SEED_COUPONS) {
    run(
      `INSERT INTO coupons (code, type, value, min_subtotal_cents, max_discount_cents, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      c.code,
      c.type,
      c.value,
      c.minSubtotalCents,
      c.maxDiscountCents,
      c.expiresAt,
      c.active ? 1 : 0,
    );
  }
}

// Produtos

const PRODUCT_COLUMNS = `id, slug, name, description, price_cents AS priceCents,
  stock, weight_grams AS weightGrams`;

export function listProducts() {
  return all<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY id`);
}

export function findProductBySlug(slug: string) {
  return one<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE slug = ?`, slug);
}

export function findProductById(id: number) {
  return one<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`, id);
}

export function decrementStock(productId: number, quantity: number) {
  run('UPDATE products SET stock = stock - ? WHERE id = ?', quantity, productId);
}

// Cupons

export function findCoupon(code: string): Coupon | null {
  const row = one<Omit<Coupon, 'active'> & { active: number }>(
    `SELECT code, type, value, min_subtotal_cents AS minSubtotalCents,
       max_discount_cents AS maxDiscountCents, expires_at AS expiresAt, active
     FROM coupons WHERE code = ?`,
    code.trim().toUpperCase(),
  );
  return row ? { ...row, active: row.active === 1 } : null;
}

// Carrinhos

export function createCart(): Cart {
  const id = `cart_${crypto.randomUUID()}`;
  run('INSERT INTO carts (id, created_at) VALUES (?, ?)', id, new Date().toISOString());
  return { id, items: [] };
}

export function cartExists(cartId: string) {
  return one('SELECT 1 FROM carts WHERE id = ?', cartId) !== null;
}

export function getCart(cartId: string): Cart | null {
  if (!cartExists(cartId)) return null;

  const items = all<CartItem>(
    `SELECT ci.product_id AS productId, ci.quantity, p.slug, p.name,
       p.price_cents AS unitPriceCents, p.weight_grams AS weightGrams
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ?
     ORDER BY p.id`,
    cartId,
  );
  return { id: cartId, items };
}

export function addToCart(cartId: string, productId: number, quantity: number) {
  run(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity`,
    cartId,
    productId,
    quantity,
  );
}

export function setCartItemQuantity(cartId: string, productId: number, quantity: number) {
  if (quantity === 0) {
    removeCartItem(cartId, productId);
  } else {
    run(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
      quantity,
      cartId,
      productId,
    );
  }
}

export function removeCartItem(cartId: string, productId: number) {
  run('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', cartId, productId);
}

export function clearCart(cartId: string) {
  run('DELETE FROM cart_items WHERE cart_id = ?', cartId);
}

// Pedidos

export function createOrder(order: Order) {
  run(
    `INSERT INTO orders (id, customer_name, customer_email, cep, items_json, quote_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    order.id,
    order.customer.name,
    order.customer.email,
    order.customer.cep,
    JSON.stringify(order.items),
    JSON.stringify(order.quote),
    order.createdAt,
  );
}

export function findOrder(id: string): Order | null {
  const row = one<{
    id: string;
    name: string;
    email: string;
    cep: string;
    items: string;
    quote: string;
    createdAt: string;
  }>(
    `SELECT id, customer_name AS name, customer_email AS email, cep,
       items_json AS items, quote_json AS quote, created_at AS createdAt
     FROM orders WHERE id = ?`,
    id,
  );
  if (!row) return null;

  return {
    id: row.id,
    customer: { name: row.name, email: row.email, cep: row.cep },
    items: JSON.parse(row.items),
    quote: JSON.parse(row.quote),
    createdAt: row.createdAt,
  };
}
