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
    image TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT 'NEW',
    stock INTEGER NOT NULL DEFAULT 0,
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

export async function getDb() {
  /* ── Return cached D1 instance if already initialized ── */
  if (d1Db && tablesReady) return d1Db;

  try {
    const { env } = await import("cloudflare:workers");
    if (env.DB) {
      if (!d1Db) {
        d1Db = drizzle(env.DB, { schema });
      }
      /* Ensure tables exist (idempotent, runs once per process) */
      if (!tablesReady) {
        try {
          await d1Db.run(sql.raw(CREATE_TABLES_SQL));
          tablesReady = true;
        } catch (e) {
          console.error("[DB] D1 table creation error:", e);
          /* Tables might already exist, continue anyway */
          tablesReady = true;
        }
      }
      return d1Db;
    }
  } catch {
    // cloudflare:workers not available
  }

  /* ── Fallback: try local better-sqlite3 ── */
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

    const localDb = drizzleLocal(sqlite, { schema });
    tablesReady = true;
    return localDb;
  } catch (error) {
    console.error("[DB] Local SQLite error:", error);
  }

  return null;
}
