import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { eq, asc } from "drizzle-orm";
import { BUSINESS, CATEGORIES } from "../../../lib/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ name: string }>;
}

const VALID_CATEGORIES = new Set([...CATEGORIES.map(c => c.toLowerCase()), "gifting"]);

export async function generateMetadata({ params }: Props) {
  const { name } = await params;
  const category = decodeURIComponent(name);
  const title = `${category.charAt(0).toUpperCase() + category.slice(1)} | ${BUSINESS.name}`;
  return {
    title,
    description: `Browse our curated ${category} collection at ${BUSINESS.name}.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { name } = await params;
  const category = decodeURIComponent(name);
  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

  if (!VALID_CATEGORIES.has(category.toLowerCase())) {
    notFound();
  }

  let rows: any[] = [];
  try {
    const db = await getDb();
    if (category.toLowerCase() === "gifting") {
      /* Gifting shows featured products */
      const featured = await db.select().from(products).where(eq(products.published, true)).orderBy(asc(products.id));
      rows = featured.filter(p => p.featured);
    } else {
      /* Match category case-insensitively */
      const allProducts = await db.select().from(products).where(eq(products.published, true)).orderBy(asc(products.id));
      rows = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
  } catch (error) {
    console.error("[Category] Page fetch failed:", error);
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <main className="category-page">
      <div className="cat-breadcrumb">
        <Link href="/">Home</Link> / <span>{categoryTitle}</span>
      </div>

      <div className="cat-header">
        <h1>{categoryTitle}</h1>
        <p>{rows.length} {rows.length === 1 ? "product" : "products"}</p>
      </div>

      {rows.length === 0 ? (
        <div className="cat-empty">
          <p>No products found in this category yet.</p>
          <Link href="/" className="cat-back-btn">BROWSE ALL PRODUCTS</Link>
        </div>
      ) : (
        <div className="cat-grid">
          {rows.map(p => (
            <Link href={`/product/${p.slug}`} key={p.id} className="cat-product-card">
              <div className="cat-product-image">
                <img src={p.image} alt={p.name} />
                {p.tag && <span className="cat-product-tag">{p.tag}</span>}
              </div>
              <div className="cat-product-info">
                <p className="cat-product-category">{p.category}</p>
                <h3>{p.name}</h3>
                <div className="cat-product-price">
                  <span>{fmt(p.price)}</span>
                  {p.discount && p.discount > 0 && <span className="cat-discount">{p.discount}% OFF</span>}
                  {p.compareAtPrice && p.compareAtPrice > p.price && !p.discount && <del>{fmt(p.compareAtPrice)}</del>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .category-page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
        .cat-breadcrumb { font-size: 0.85rem; color: #888; margin-bottom: 2rem; }
        .cat-breadcrumb a { color: #888; text-decoration: none; }
        .cat-breadcrumb a:hover { color: #1a1a1a; }
        .cat-header { margin-bottom: 2rem; }
        .cat-header h1 { font-size: 2rem; font-weight: 600; margin: 0 0 0.5rem; }
        .cat-header p { color: #888; font-size: 0.9rem; margin: 0; }
        .cat-empty { text-align: center; padding: 4rem 0; }
        .cat-empty p { color: #888; margin-bottom: 1rem; }
        .cat-back-btn { display: inline-block; padding: 0.8rem 2rem; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; letter-spacing: 0.1em; font-size: 0.85rem; }
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        @media (max-width: 1024px) { .cat-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) { .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
        .cat-product-card { text-decoration: none; color: inherit; transition: transform 0.2s; }
        .cat-product-card:hover { transform: translateY(-2px); }
        .cat-product-image { position: relative; margin-bottom: 0.75rem; }
        .cat-product-image img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 8px; }
        .cat-product-tag { position: absolute; top: 8px; left: 8px; background: #1a1a1a; color: #fff; padding: 3px 8px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; border-radius: 3px; }
        .cat-product-category { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin: 0 0 0.25rem; }
        .cat-product-info h3 { font-size: 0.95rem; margin: 0 0 0.5rem; font-weight: 500; }
        .cat-product-price { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
        .cat-product-price span:first-child { font-weight: 600; }
        .cat-discount { background: #fef2f2; color: #d32f2f; padding: 1px 6px; border-radius: 3px; font-size: 0.75rem; font-weight: 600; }
        .cat-product-price del { color: #999; font-size: 0.85rem; }
      `}</style>
    </main>
  );
}
