import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let tablesReady = false;

/* Each CREATE TABLE as a separate statement — Neon HTTP driver requires individual execution */
const CREATE_TABLES = [
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
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
    published BOOLEAN NOT NULL DEFAULT false,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    modules TEXT NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
];

export async function getDb() {
  if (db && tablesReady) return db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[DB] DATABASE_URL environment variable is not set.");
    console.error("[DB] Please configure your Neon PostgreSQL connection string in Vercel environment variables.");
    throw new Error("Database configuration error: DATABASE_URL is not set. Please configure your Neon PostgreSQL connection.");
  }

  try {
    const sql_client = neon(databaseUrl);
    db = drizzle(sql_client, { schema });

    if (!tablesReady) {
      /* Initialize tables one-by-one (Neon HTTP driver does not support multi-statement queries) */
      for (const stmt of CREATE_TABLES) {
        try {
          await db.execute(sql.raw(stmt));
        } catch (e) {
          console.error("[DB] Table creation error:", e);
        }
      }
      tablesReady = true;
    }

    return db;
  } catch (error) {
    console.error("[DB] Neon PostgreSQL connection failed:", error);
    throw new Error("Database connection failed. Please check your DATABASE_URL configuration.");
  }
}
