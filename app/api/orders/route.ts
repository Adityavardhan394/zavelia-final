import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orders, customers, products } from "../../../db/schema";
import { BUSINESS, generateOrderRef, calcShipping } from "../../../lib/config";

/* ── Place an order from the storefront (server-side price validation) ── */
export async function POST(request: Request) {
  const body = await request.json();
  const {
    items, customerName, customerPhone, customerEmail,
    address, pincode
  } = body as {
    items: { productId: number; qty: number }[];
    customerName: string; customerPhone: string; customerEmail?: string;
    address: string; pincode: string;
  };

  if (!customerName || !customerPhone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  try {
    const db = await getDb();
    if (!db) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    /* Look up actual prices from DB for each product */
    const productIds = items.map(i => i.productId);
    const dbProducts = await db.select().from(products);
    const productMap = new Map(dbProducts.filter(p => productIds.includes(p.id)).map(p => [p.id, p]));

    /* Validate all products and calculate totals */
    let subtotal = 0;
    const validatedItems: { name: string; qty: number; price: number }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return Response.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }
      if (!product.published) {
        return Response.json({ error: `${product.name} is no longer available` }, { status: 400 });
      }
      if (product.stock < item.qty) {
        return Response.json({ error: `Only ${product.stock} units of ${product.name} available` }, { status: 400 });
      }
      if (item.qty < 1) {
        return Response.json({ error: "Invalid quantity" }, { status: 400 });
      }

      /* Use DB price (server-side validation) */
      const price = product.price;
      subtotal += price * item.qty;
      validatedItems.push({ name: product.name, qty: item.qty, price });
    }

    const shipping = calcShipping(subtotal);
    const total = subtotal + shipping;

    /* Generate unique order ref server-side */
    let ref = generateOrderRef();
    const existingOrder = await db.select().from(orders).where(eq(orders.ref, ref)).limit(1);
    if (existingOrder.length > 0) {
      /* Collision: generate another ref */
      ref = generateOrderRef();
    }

    /* Find or create a customer record */
    let customerId: number;
    const email = customerEmail || `${customerPhone}@guest.zavelia`;

    const existing = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
    if (existing.length > 0) {
      customerId = existing[0].id;
    } else {
      const result = await db.insert(customers).values({
        name: customerName,
        email,
        phone: customerPhone,
        passwordHash: "guest",
      }).returning();
      customerId = result[0].id;
    }

    /* Insert the order */
    const [order] = await db.insert(orders).values({
      customerId,
      ref,
      items: JSON.stringify(validatedItems),
      subtotal: Math.round(subtotal),
      shipping: Math.round(shipping),
      total: Math.round(total),
      status: "pending",
      customerName,
      customerPhone,
      address,
      pincode,
    }).returning();

    return Response.json({ order, ok: true }, { status: 201 });
  } catch (error) {
    console.error("Order placement error:", error);
    return Response.json({ error: "Failed to place order" }, { status: 500 });
  }
}

/* ── Get orders (optionally filtered by email) ── */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  try {
    const db = await getDb();
    if (!db) {
      return Response.json({ orders: [] });
    }

    if (email) {
      /* Get orders for a specific customer */
      const cust = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
      if (cust.length === 0) return Response.json({ orders: [] });
      const rows = await db.select().from(orders).where(eq(orders.customerId, cust[0].id));
      return Response.json({ orders: rows });
    }

    /* Return all orders */
    const rows = await db.select().from(orders);
    return Response.json({ orders: rows });
  } catch {
    return Response.json({ orders: [] });
  }
}
