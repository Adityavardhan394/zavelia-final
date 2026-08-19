import { getDb } from "../../../../../db";
import { products } from "../../../../../db/schema";
import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { BUSINESS } from "../../../../../lib/config";

const admins = new Set<string>(BUSINESS.adminEmails);
async function ok() { const u = await getChatGPTUser(); return Boolean(u && admins.has(u.email.toLowerCase())); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await ok()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.published === "boolean") update.published = body.published;
  if (typeof body.stock === "number" && body.stock >= 0) update.stock = body.stock;
  if (typeof body.price === "number" && body.price > 0) update.price = body.price;
  if (typeof body.compareAtPrice === "number" || body.compareAtPrice === null) update.compareAtPrice = body.compareAtPrice;
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.image === "string") update.image = body.image;
  if (typeof body.tag === "string") update.tag = body.tag;
  if (typeof body.category === "string") update.category = body.category;
  if (typeof body.featured === "boolean") update.featured = body.featured;
  if (typeof body.discount === "number") update.discount = body.discount;
  try {
    const db = await getDb();
    const [product] = await db.update(products).set(update).where(eq(products.id, Number(id))).returning();
    return Response.json({ product });
  } catch (error) {
    console.error("[API] Admin product PATCH failed:", error);
    return Response.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await ok()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const db = await getDb();
    await db.delete(products).where(eq(products.id, Number(id)));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[API] Admin product DELETE failed:", error);
    return Response.json({ error: "Failed to delete product." }, { status: 500 });
  }
}
