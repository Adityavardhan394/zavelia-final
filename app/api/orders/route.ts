import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { orders, customers } from "../../../db/schema";

/* ── Place an order from the storefront ── */
export async function POST(request: Request) {
  const body = await request.json();
  const {
    ref, items, subtotal, shipping, total,
    customerName, customerPhone, customerEmail,
    address, pincode
  } = body as {
    ref: string; items: unknown; subtotal: number; shipping: number; total: number;
    customerName: string; customerPhone: string; customerEmail?: string;
    address: string; pincode: string;
  };

  if (!ref || !customerName || !customerPhone) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const db = await getDb();
    if (!db) {
      return Response.json({ error: "Database not available", fallback: true }, { status: 503 });
    }

    /* Check if order with this ref already exists */
    const existingOrder = await db.select().from(orders).where(eq(orders.ref, ref)).limit(1);
    if (existingOrder.length > 0) {
      return Response.json({ order: existingOrder[0], ok: true, existing: true });
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
      items: typeof items === "string" ? items : JSON.stringify(items),
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
    return Response.json({ error: "Failed to place order", fallback: true }, { status: 500 });
  }
}

/* ── Get orders (optionally filtered by email) ── */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  try {
    const db = await getDb();
    if (!db) {
      return Response.json({ orders: [], fallback: true });
    }

    if (email) {
      /* Get orders for a specific customer */
      const cust = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
      if (cust.length === 0) return Response.json({ orders: [] });
      const rows = await db.select().from(orders).where(eq(orders.customerId, cust[0].id));
      return Response.json({ orders: rows });
    }

    /* Return all orders (for admin fallback) */
    const rows = await db.select().from(orders);
    return Response.json({ orders: rows });
  } catch {
    return Response.json({ orders: [], fallback: true });
  }
}
