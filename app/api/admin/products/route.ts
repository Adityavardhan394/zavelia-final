import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { BUSINESS } from "../../../../lib/config";

const admins = new Set<string>(BUSINESS.adminEmails);
async function authorized() { const user = await getChatGPTUser(); return user && admins.has(user.email.toLowerCase()) ? user : null; }
function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function GET() {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const rows = await db.select().from(products).orderBy(asc(products.id));
    return Response.json({ products: rows });
  } catch (error) {
    console.error("[API] Admin products GET failed:", error);
    return Response.json({ error: "Database connection failed. Please contact the administrator." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await authorized()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const name = clean(body.name), category = clean(body.category), description = clean(body.description), image = clean(body.image).replace(/\?$/, ""), tag = clean(body.tag) || "NEW", price = Number(body.price), stock = Number(body.stock);
  if (name.length < 2) return Response.json({ error: "Enter a product name." }, { status: 400 });
  if (!["Jewellery", "Beauty", "Accessories"].includes(category)) return Response.json({ error: "Select a valid category." }, { status: 400 });
  if (description.length < 5) return Response.json({ error: "Add a useful product description." }, { status: 400 });
  if (!Number.isInteger(price) || price <= 0) return Response.json({ error: "Price must be greater than ₹0." }, { status: 400 });
  if (!Number.isInteger(stock) || stock < 0) return Response.json({ error: "Stock cannot be negative." }, { status: 400 });
  try { new URL(image.replace(/\?$/, "")) } catch { return Response.json({ error: "Enter a valid product image URL." }, { status: 400 }); }
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`;
  const compareAtPrice = body.compareAtPrice ? Number(body.compareAtPrice) : null;
  const discount = body.discount ? Number(body.discount) : 0;
  try {
    const db = await getDb();
    const [product] = await db.insert(products).values({ name, slug, category: category as "Jewellery" | "Beauty" | "Accessories", description, price, compareAtPrice, image, tag, stock, published: Boolean(body.published), featured: Boolean(body.featured), discount }).returning();
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[API] Admin product POST failed:", error);
    return Response.json({ error: "Failed to create product. Please try again." }, { status: 500 });
  }
}
