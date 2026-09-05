import { getDatabase } from "@netlify/database";
import type { Product } from "@/types/product";

export async function getCatalogProducts(): Promise<Product[]> {
  const db = getDatabase();
  const rows = await db.sql`SELECT id, name, slug, category, price, description, specs, warranty, stock_status, featured, badge, image FROM products ORDER BY created_at DESC`;
  return rows.map((row: any) => ({
    id: String(row.id), name: String(row.name), slug: String(row.slug), category: String(row.category),
    price: Number(row.price), description: String(row.description || ""),
    specs: Array.isArray(row.specs) ? row.specs.map(String) : [],
    warranty: row.warranty ? String(row.warranty) : undefined,
    stockStatus: row.stock_status as Product["stockStatus"], featured: Boolean(row.featured),
    badge: row.badge ? String(row.badge) as Product["badge"] : undefined,
    image: row.image ? String(row.image) : undefined,
  }));
}
