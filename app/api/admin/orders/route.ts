import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ORDER_STATUSES, isOrderStatus } from "../../../../lib/config";

const admins = new Set(["padbhog@gmail.com", "adityavardhan394@gmail.com"]);
async function authorized() {
  const user = await getChatGPTUser();
  return user && admins.has(user.email.toLowerCase()) ? user : null;
}

export async function GET() {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.id));
    return Response.json({ orders: rows });
  } catch (error) {
    console.error("[API] Admin orders GET failed:", error);
    return Response.json({ error: "Database connection failed. Please contact the administrator." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { id?: number; ref?: string; status?: unknown };

  /* Validate status */
  if (!body.status || !isOrderStatus(body.status)) {
    return Response.json(
      { error: "Invalid order status", allowedStatuses: ORDER_STATUSES },
      { status: 400 }
    );
  }

  /* Validate identifier: need either ref or id */
  if (!body.ref && !body.id) {
    return Response.json({ error: "Missing order identifier (id or ref)" }, { status: 400 });
  }

  try {
    const db = await getDb();

    /* Match by ref or by id */
    const condition = body.ref
      ? eq(orders.ref, body.ref)
      : eq(orders.id, body.id as number);

    const [updated] = await db
      .update(orders)
      .set({ status: body.status })
      .where(condition)
      .returning();

    if (!updated) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json({ order: updated });
  } catch (error) {
    console.error("[API] Admin orders PATCH failed:", error);
    return Response.json({ error: "Failed to update order." }, { status: 500 });
  }
}
