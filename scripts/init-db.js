import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'local-dev.db');

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database');
  } catch (err) {
    console.log('Could not remove existing database, might be in use');
  }
}

// Create new database
const sqlite = new Database(dbPath);

// Create tables
sqlite.exec(`
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
    customer_id INTEGER NOT NULL,
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
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
`);

// Insert seed products
const seedProducts = [
  { id:1, name:"Saanjh Pearl Hoops", slug:"saanjh-pearl-hoops", category:"Jewellery", description:"Lightweight pearl-accent hoops with a polished gold-tone finish.", price:1299, compareAtPrice:1599, image:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85", tag:"BESTSELLER", stock:18, published:1, featured:1 },
  { id:2, name:"Noor Layered Necklace", slug:"noor-layered-necklace", category:"Jewellery", description:"A delicate layered necklace designed for everyday styling and gifting.", price:1899, compareAtPrice:2299, image:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85", tag:"NEW", stock:12, published:1, featured:1 },
  { id:3, name:"Luma Dew Serum", slug:"luma-dew-serum", category:"Beauty", description:"A lightweight hydrating face serum for a fresh, dewy finish.", price:899, compareAtPrice:null, image:"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85", tag:"BEAUTY", stock:25, published:1, featured:1 },
  { id:4, name:"Mira Mini Bag", slug:"mira-mini-bag", category:"Accessories", description:"A compact statement bag with a structured silhouette and versatile strap.", price:2199, compareAtPrice:2699, image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85", tag:"LIMITED", stock:9, published:1, featured:1 },
  { id:5, name:"Velvet Bloom Lip Tint", slug:"velvet-bloom-lip-tint", category:"Beauty", description:"A soft-focus lip tint with comfortable colour for day-to-evening wear.", price:649, compareAtPrice:799, image:"https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85", tag:"TRENDING", stock:30, published:1, featured:0 },
  { id:6, name:"Aira Hair Claw Set", slug:"aira-hair-claw-set", category:"Accessories", description:"Three polished hair claws in versatile neutral tones.", price:499, compareAtPrice:599, image:"https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=900&q=85", tag:"NEW", stock:40, published:1, featured:0 },
];

const insertProduct = sqlite.prepare(`
  INSERT INTO products (id, name, slug, category, description, price, compare_at_price, image, tag, stock, published, featured)
  VALUES (@id, @name, @slug, @category, @description, @price, @compareAtPrice, @image, @tag, @stock, @published, @featured)
`);

seedProducts.forEach(product => {
  try {
    insertProduct.run(product);
  } catch (err) {
    console.log('Product already exists:', product.name);
  }
});

console.log('Database initialized successfully with seed data');
sqlite.close();