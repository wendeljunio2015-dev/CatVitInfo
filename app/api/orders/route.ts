import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";

const whatsappNumber = "5562994780830";

type RequestedItem = { productId?: string; quantity?: number };

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `VI-${date}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedItems = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    const customerName = String(body.customerName || "").trim().slice(0, 120) || null;

    const normalized = requestedItems
      .map((item) => ({ productId: String(item.productId || "").trim(), quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)) }))
      .filter((item) => item.productId);

    if (!normalized.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });

    const db = getDatabase();
    const ids = normalized.map((item) => item.productId);
    const rows = await db.sql`
      SELECT id, name, price, stock_quantity
      FROM products
      WHERE id = ANY(${ids}::text[])
    `;

    const productMap = new Map(rows.map((row: any) => [String(row.id), row]));
    const items = [] as Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }>;

    for (const requested of normalized) {
      const product = productMap.get(requested.productId) as any;
      if (!product) continue;
      const available = Number(product.stock_quantity ?? 0);
      if (available <= 0) continue;
      const quantity = Math.min(requested.quantity, available);
      const unitPrice = Number(product.price);
      items.push({
        productId: requested.productId,
        name: String(product.name),
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      });
    }

    if (!items.length) return NextResponse.json({ error: "Nenhum item disponível no momento" }, { status: 409 });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const id = crypto.randomUUID();
    const orderNumber = makeOrderNumber();

    await db.sql`
      INSERT INTO orders (id, order_number, customer_name, items, total, status, source)
      VALUES (${id}, ${orderNumber}, ${customerName}, ${JSON.stringify(items)}::jsonb, ${total}, 'novo', 'whatsapp')
    `;

    const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const lines = [
      `Olá! Gostaria de solicitar o orçamento ${orderNumber} na Vitória Informática:`,
      customerName ? `Cliente: ${customerName}` : "",
      "",
      ...items.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.subtotal)}`),
      "",
      `Total estimado: ${money.format(total)}`,
      "",
      "Por favor, confirme disponibilidade, garantia e condições de retirada/entrega em Goiânia.",
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    return NextResponse.json({ ok: true, orderNumber, total, whatsappUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o orçamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
