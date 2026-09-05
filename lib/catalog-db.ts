import { getDatabase } from "@netlify/database";
import type { Product } from "@/types/product";

function mapProduct(row: any): Product {
  const images = Array.isArray(row.images) ? row.images.map(String).filter(Boolean) : [];
  const fallbackImage = row.image ? String(row.image) : undefined;
  const gallery = images.length ? images : fallbackImage ? [fallbackImage] : [];

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    category: String(row.category),
    price: Number(row.price),
    description: String(row.description || ""),
    specs: Array.isArray(row.specs) ? row.specs.map(String) : [],
    warranty: row.warranty ? String(row.warranty) : undefined,
    stockStatus: row.stock_status as Product["stockStatus"],
    featured: Boolean(row.featured),
    badge: row.badge ? (String(row.badge) as Product["badge"]) : undefined,
    image: gallery[0],
    images: gallery,
  };
}

const fields = "id, name, slug, category, price, description, specs, warranty, stock_status, featured, badge, image, images";

export async function getCatalogProducts(): Promise<Product[]> {
  const db = getDatabase();
  const rows = await db.sql.unsafe(`SELECT ${fields} FROM products ORDER BY created_at DESC`);
  return rows.map(mapProduct);
}

export async function getCatalogProductBySlug(slug: string): Promise<Product | null> {
  const db = getDatabase();
  const rows = await db.sql`SELECT id, name, slug, category, price, description, specs, warranty, stock_status, featured, badge, image, images FROM products WHERE slug = ${slug} LIMIT 1`;
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function getCatalogProductById(id: string): Promise<Product | null> {
  const db = getDatabase();
  const rows = await db.sql`SELECT id, name, slug, category, price, description, specs, warranty, stock_status, featured, badge, image, images FROM products WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapProduct(rows[0]) : null;
}
