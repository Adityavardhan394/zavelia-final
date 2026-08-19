import { asc, eq, and } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  try {
    const db = await getDb();
    if (!db) return Response.json({ products: [] });

    let rows;
    if (slug) {
      rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    } else if (category && category !== "All") {
      rows = await db.select().from(products).where(
        and(eq(products.category, category as "Jewellery" | "Beauty" | "Accessories"), eq(products.published, true))
      ).orderBy(asc(products.id));
    } else {
      rows = await db.select().from(products).where(eq(products.published, true)).orderBy(asc(products.id));
    }
    return Response.json({ products: rows }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
  } catch {
    return Response.json({ products: [] });
  }
}
