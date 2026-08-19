import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { eq, asc, type InferSelectModel } from "drizzle-orm";
import { BUSINESS } from "../../../lib/config";
import Link from "next/link";

type Product = InferSelectModel<typeof products>;

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  let product;
  try {
    const db = await getDb();
    const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    product = rows[0];
  } catch (error) {
    console.error("[Product] Metadata fetch failed:", error);
  }
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | ${BUSINESS.name}`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image, width: 900, height: 900, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product: Product | undefined;
  let relatedProducts: Product[] = [];
  try {
    const db = await getDb();
    const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    product = rows[0];
    if (product && product.published) {
      /* Fetch related products from same category */
      const related = await db.select().from(products)
        .where(eq(products.category, product.category))
        .orderBy(asc(products.id));
      relatedProducts = related.filter(p => p.id !== product!.id && p.published).slice(0, 4);
    }
  } catch (error) {
    console.error("[Product] Page fetch failed:", error);
  }
  if (!product || !product.published) notFound();

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const discountPrice = product.discount && product.discount > 0
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: discountPrice,
      priceCurrency: BUSINESS.currency,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="product-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pd-breadcrumb">
        <Link href="/">Home</Link> / <Link href={`/category/${product.category}`}>{product.category}</Link> / <span>{product.name}</span>
      </div>

      <div className="pd-layout">
        <div className="pd-image">
          <img src={product.image} alt={product.name} />
          {product.tag && <span className="pd-badge">{product.tag}</span>}
        </div>

        <div className="pd-info">
          <p className="pd-category">{product.category}</p>
          <h1>{product.name}</h1>

          <div className="pd-price">
            {product.discount && product.discount > 0 ? (
              <>
                <span className="pd-price-current">{fmt(discountPrice)}</span>
                <span className="pd-price-original"><del>{fmt(product.price)}</del></span>
                <span className="pd-price-discount">{product.discount}% OFF</span>
              </>
            ) : (
              <span className="pd-price-current">{fmt(product.price)}</span>
            )}
            {product.compareAtPrice && product.compareAtPrice > product.price && !product.discount && (
              <del className="pd-price-compare">{fmt(product.compareAtPrice)}</del>
            )}
          </div>

          <p className="pd-description">{product.description}</p>

          <div className="pd-stock">
            {product.stock > 0 ? (
              <span className="pd-in-stock">In Stock ({product.stock} available)</span>
            ) : (
              <span className="pd-out-stock">Sold Out</span>
            )}
          </div>

          <div className="pd-actions">
            <Link href="/" className="pd-btn-primary">
              {product.stock > 0 ? "ADD TO BAG" : "SOLD OUT"}
            </Link>
          </div>

          <div className="pd-meta">
            <p>Free shipping above {fmt(BUSINESS.freeShippingMin)}</p>
            <p>Easy 7-day returns</p>
            <p>
              Need help? <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp us</a>
            </p>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="pd-related">
          <h2>You may also like</h2>
          <div className="pd-related-grid">
            {relatedProducts.map(rp => (
              <Link href={`/product/${rp.slug}`} key={rp.id} className="pd-related-card">
                <img src={rp.image} alt={rp.name} />
                <h3>{rp.name}</h3>
                <p>{fmt(rp.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <style>{`
        .product-detail-page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
        .pd-breadcrumb { font-size: 0.85rem; color: #888; margin-bottom: 2rem; }
        .pd-breadcrumb a { color: #888; text-decoration: none; }
        .pd-breadcrumb a:hover { color: #1a1a1a; }
        .pd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-bottom: 4rem; }
        @media (max-width: 768px) { .pd-layout { grid-template-columns: 1fr; gap: 1.5rem; } }
        .pd-image { position: relative; }
        .pd-image img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
        .pd-badge { position: absolute; top: 12px; left: 12px; background: #1a1a1a; color: #fff; padding: 4px 12px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; border-radius: 4px; }
        .pd-category { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.15em; color: #888; margin-bottom: 0.5rem; }
        .pd-info h1 { font-size: 2rem; font-weight: 600; margin: 0 0 1rem; color: #1a1a1a; }
        .pd-price { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .pd-price-current { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; }
        .pd-price-original del, .pd-price-compare { color: #999; font-size: 1.1rem; }
        .pd-price-discount { background: #fef2f2; color: #d32f2f; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
        .pd-description { font-size: 1rem; line-height: 1.7; color: #555; margin-bottom: 1.5rem; }
        .pd-stock { margin-bottom: 1.5rem; }
        .pd-in-stock { color: #2e7d32; font-weight: 500; font-size: 0.9rem; }
        .pd-out-stock { color: #d32f2f; font-weight: 500; font-size: 0.9rem; }
        .pd-actions { margin-bottom: 2rem; }
        .pd-btn-primary { display: inline-block; padding: 1rem 2.5rem; background: #1a1a1a; color: #fff; text-decoration: none; font-weight: 600; letter-spacing: 0.1em; border-radius: 8px; font-size: 0.9rem; transition: background 0.2s; }
        .pd-btn-primary:hover { background: #333; }
        .pd-meta { border-top: 1px solid #eee; padding-top: 1.5rem; font-size: 0.9rem; color: #666; }
        .pd-meta p { margin: 0.5rem 0; }
        .pd-meta a { color: #1a1a1a; text-decoration: underline; }
        .pd-related { margin-top: 3rem; border-top: 1px solid #eee; padding-top: 2rem; }
        .pd-related h2 { font-size: 1.3rem; margin-bottom: 1.5rem; }
        .pd-related-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        @media (max-width: 768px) { .pd-related-grid { grid-template-columns: repeat(2, 1fr); } }
        .pd-related-card { text-decoration: none; color: inherit; }
        .pd-related-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem; }
        .pd-related-card h3 { font-size: 0.9rem; margin: 0 0 0.25rem; }
        .pd-related-card p { font-size: 0.85rem; color: #555; margin: 0; }
      `}</style>
    </main>
  );
}
