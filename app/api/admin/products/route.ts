import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { saveProductImage } from "@/lib/product-images";
import { productCategories } from "@/data/categories";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function uploadedFiles(data: FormData) {
  const files = data.getAll("imageFiles").filter((item): item is File => item instanceof File && item.size > 0);
  const legacy = data.get("imageFile");
  if (!files.length && legacy instanceof File && legacy.size > 0) files.push(legacy);
  return files;
}

function parseSpecs(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const data = await request.formData();
    const name = String(data.get("name") || "").trim();
    const category = String(data.get("category") || "").trim();
    const price = Number(String(data.get("price") || "0").replace(",", "."));
    if (!name || !productCategories.includes(category as any) || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const files = uploadedFiles(data);
    if (files.length > 5) return NextResponse.json({ error: "Use no máximo 5 fotos por produto." }, { status: 400 });

    const uploaded = await Promise.all(files.map(saveProductImage));
    const manualImage = String(data.get("image") || "").trim();
    const images = uploaded.length ? uploaded : manualImage ? [manualImage] : [];
    const image = images[0] || null;
    const specs = parseSpecs(data.get("specs"));

    const id = `${slugify(name)}-${Date.now()}`;
    const slug = `${slugify(name)}-${Date.now().toString().slice(-6)}`;
    const db = getDatabase();
    await db.sql`INSERT INTO products (id, name, slug, category, price, description, specs, warranty, stock_status, featured, badge, image, images) VALUES (${id}, ${name}, ${slug}, ${category}, ${price}, ${String(data.get("description") || "")}, ${JSON.stringify(specs)}::jsonb, ${String(data.get("warranty") || "") || null}, ${String(data.get("stockStatus") || "em_estoque")}, ${data.get("featured") === "on"}, ${String(data.get("badge") || "") || null}, ${image}, ${JSON.stringify(images)}::jsonb)`;
    return NextResponse.redirect(new URL("/admin?created=1", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível cadastrar o produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const data = await request.formData();
    const id = String(data.get("id") || "").trim();
    const files = uploadedFiles(data);
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
    if (!files.length) return NextResponse.json({ error: "Selecione uma imagem" }, { status: 400 });

    const db = getDatabase();
    const current = await db.sql`SELECT images, image FROM products WHERE id = ${id} LIMIT 1`;
    if (!current.length) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

    const oldImages = Array.isArray(current[0].images) ? current[0].images.map(String) : current[0].image ? [String(current[0].image)] : [];
    const newImage = await saveProductImage(files[0]);
    const images = [newImage, ...oldImages.slice(1)].slice(0, 5);
    await db.sql`UPDATE products SET image = ${newImage}, images = ${JSON.stringify(images)}::jsonb, updated_at = NOW() WHERE id = ${id}`;

    return NextResponse.json({ ok: true, image: newImage, images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar a foto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const db = getDatabase();
  await db.sql`DELETE FROM products WHERE id = ${String(id)}`;
  return NextResponse.json({ ok: true });
}
