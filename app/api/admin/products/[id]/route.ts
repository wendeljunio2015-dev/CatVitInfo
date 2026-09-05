import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveProductImage } from "@/lib/product-images";
import { productCategories } from "@/data/categories";

function parseSpecs(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const data = await request.formData();
    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const price = Number(String(data.get("price") || "0").replace(",", "."));

    if (!name || !productCategories.includes(category as any) || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const db = getDatabase();
    const currentRows = await db.sql`SELECT images, image FROM products WHERE id = ${id} LIMIT 1`;
    if (!currentRows.length) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const current = currentRows[0];
    const existingImages = Array.isArray(current.images)
      ? current.images.map(String).filter(Boolean)
      : current.image
        ? [String(current.image)]
        : [];

    const removed = new Set(data.getAll("removeImages").map(String));
    const keptImages = existingImages.filter((url) => !removed.has(url));
    const newFiles = data.getAll("imageFiles").filter((item): item is File => item instanceof File && item.size > 0);

    if (keptImages.length + newFiles.length > 5) {
      return NextResponse.json({ error: "O produto pode ter no máximo 5 fotos." }, { status: 400 });
    }

    const uploadedImages = await Promise.all(newFiles.map(saveProductImage));
    let images = [...keptImages, ...uploadedImages].slice(0, 5);
    const requestedPrimary = String(data.get("primaryImage") || "");
    if (requestedPrimary && images.includes(requestedPrimary)) {
      images = [requestedPrimary, ...images.filter((url) => url !== requestedPrimary)];
    }

    const image = images[0] || null;
    const badge = String(data.get("badge") || "") || null;
    const warranty = String(data.get("warranty") || "").trim() || null;
    const stockStatus = String(data.get("stockStatus") || "em_estoque");
    const specs = parseSpecs(data.get("specs"));

    if (!["em_estoque", "ultimas_unidades", "indisponivel"].includes(stockStatus)) {
      return NextResponse.json({ error: "Status de estoque inválido" }, { status: 400 });
    }
    if (badge && !["Novo", "Promoção", "Destaque"].includes(badge)) {
      return NextResponse.json({ error: "Selo inválido" }, { status: 400 });
    }

    await db.sql`
      UPDATE products
      SET name = ${name},
          category = ${category},
          price = ${price},
          description = ${String(data.get("description") || "")},
          specs = ${JSON.stringify(specs)}::jsonb,
          warranty = ${warranty},
          stock_status = ${stockStatus},
          featured = ${data.get("featured") === "on"},
          badge = ${badge},
          image = ${image},
          images = ${JSON.stringify(images)}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.redirect(new URL(`/admin/produtos/${encodeURIComponent(id)}/editar?saved=1`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível editar o produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
