import { drizzle } from "drizzle-orm/d1";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

let d1Db: ReturnType<typeof drizzle> | null = null;
let tablesReady = false;

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    compare_at_price INTEGER,
    discount INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'NEW',
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    published INTEGER NOT NULL DEFAULT 0,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    ref TEXT NOT NULL UNIQUE,
    items TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    modules TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

const SEED_PRODUCTS_SQL = `
  INSERT OR IGNORE INTO products (name, slug, category, description, price, compare_at_price, discount, image, tag, stock, low_stock_threshold, published, featured)
  VALUES
    ('Saanjh Pearl Hoops', 'saanjh-pearl-hoops', 'Jewellery', 'Lightweight pearl-accent hoops with a polished gold-tone finish.', 1299, 1599, 0, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85', 'BESTSELLER', 18, 5, 1, 1),
    ('Noor Layered Necklace', 'noor-layered-necklace', 'Jewellery', 'A delicate layered necklace designed for everyday styling and gifting.', 1899, 2299, 0, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85', 'NEW', 12, 5, 1, 1),
    ('Luma Dew Serum', 'luma-dew-serum', 'Beauty', 'A lightweight hydrating face serum for a fresh, dewy finish.', 899, NULL, 0, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85', 'BEAUTY', 25, 5, 1, 1),
    ('Mira Mini Bag', 'mira-mini-bag', 'Accessories', 'A compact statement bag with a structured silhouette and versatile strap.', 2199, 2699, 0, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85', 'LIMITED', 9, 5, 1, 1),
    ('Velvet Bloom Lip Tint', 'velvet-bloom-lip-tint', 'Beauty', 'A soft-focus lip tint with comfortable colour for day-to-evening wear.', 649, 799, 0, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85', 'TRENDING', 30, 5, 1, 0),
    ('Aira Hair Claw Set', 'aira-hair-claw-set', 'Accessories', 'Three polished hair claws in versatile neutral tones.', 499, 599, 0, 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=900&q=85', 'NEW', 40, 5, 1, 0);
`;

/* Migration: add columns that may be missing from older databases */
const MIGRATIONS_SQL = `
  ALTER TABLE products ADD COLUMN discount INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;
`;

export async function getDb() {
  if (d1Db && tablesReady) return d1Db;

  try {
    const { env } = await import("cloudflare:workers");
    if (env.DB) {
      if (!d1Db) {
        d1Db = drizzle(env.DB, { schema });
      }
      if (!tablesReady) {
        try {
          await d1Db.run(sql.raw(CREATE_TABLES_SQL));
          /* Run migrations (safe to re-run, ignores duplicate column errors) */
          for (const stmt of MIGRATIONS_SQL.split(";").filter(s => s.trim())) {
            try { await d1Db.run(sql.raw(stmt)); } catch { /* column may already exist */ }
          }
          /* Seed products if table is empty */
          const count = await d1Db.run(sql.raw("SELECT COUNT(*) as c FROM products"));
          const rows = (count as any)?.results;
          const productCount = Array.isArray(rows) && rows.length > 0 ? Number(rows[0].c) : 0;
          if (productCount === 0) {
            await d1Db.run(sql.raw(SEED_PRODUCTS_SQL));
          }
        } catch (e) {
          console.error("[DB] D1 initialization error:", e);
        }
        tablesReady = true;
      }
      return d1Db;
    }
  } catch {
    // cloudflare:workers not available
  }

  /* Fallback: local better-sqlite3 */
  try {
    const { drizzle: drizzleLocal } = await import("drizzle-orm/better-sqlite3");
    const Database = (await import("better-sqlite3")).default;
    const { join } = await import("path");
    const { existsSync } = await import("fs");

    const dbPath = join(process.cwd(), "local-dev.db");
    const sqlite = new Database(dbPath);

    if (!existsSync(dbPath) || sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length === 0) {
      sqlite.exec(CREATE_TABLES_SQL);
    }

    /* Run migrations on existing databases (add missing columns) */
    for (const stmt of MIGRATIONS_SQL.split(";").filter(s => s.trim())) {
      try { sqlite.exec(stmt); } catch { /* column may already exist */ }
    }

    /* Seed if empty */
    const countRow = sqlite.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number };
    if (countRow.c === 0) {
      sqlite.exec(SEED_PRODUCTS_SQL);
    }

    const localDb = drizzleLocal(sqlite, { schema });
    tablesReady = true;
    return localDb;
  } catch (error) {
    console.error("[DB] Local SQLite error:", error);
  }

  return null;
}
