import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";

const whatsappNumber = "5562994780830";
type RequestedItem = { productId?: string; quantity?: number };

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `VI-${date}-${suffix}`;
}

function normalizePhone(value: string) { return value.replace(/\D/g, "").slice(0, 20); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedItems = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    let customerName = String(body.customerName || "").trim().slice(0, 120) || null;
    let customerPhone = normalizePhone(String(body.customerPhone || "")) || null;
    let customerEmail = String(body.customerEmail || "").trim().toLowerCase().slice(0, 180) || null;

    const normalized = requestedItems.map((item) => ({ productId: String(item.productId || "").trim(), quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)) })).filter((item) => item.productId);
    if (!normalized.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });

    const db = getDatabase();
    const ids = normalized.map((item) => item.productId);
    const rows = await db.sql`SELECT id, name, price, stock_quantity FROM products WHERE id = ANY(${ids}::text[])`;
    const productMap = new Map(rows.map((row: any) => [String(row.id), row]));
    const items = [] as Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }>;

    for (const requested of normalized) {
      const product = productMap.get(requested.productId) as any;
      if (!product) return NextResponse.json({ error: "Um produto do carrinho não está mais disponível no catálogo. Remova-o e tente novamente." }, { status: 409 });
      const available = Number(product.stock_quantity ?? 0);
      if (available <= 0) return NextResponse.json({ error: `${String(product.name)} está indisponível no momento. Remova o item do carrinho.` }, { status: 409 });
      if (requested.quantity > available) return NextResponse.json({ error: `${String(product.name)} possui apenas ${available} unidade(s) disponível(is). Ajuste a quantidade no carrinho.` }, { status: 409 });
      const unitPrice = Number(product.price);
      items.push({ productId: requested.productId, name: String(product.name), quantity: requested.quantity, unitPrice, subtotal: unitPrice * requested.quantity });
    }

    let customerId = await getAuthenticatedCustomerId();
    if (customerId) {
      const logged = await db.sql`SELECT id,name,phone,email FROM customers WHERE id=${customerId} LIMIT 1`;
      if (logged.length) {
        customerName = String(logged[0].name || customerName || "Cliente");
        customerPhone = logged[0].phone ? String(logged[0].phone) : customerPhone;
        customerEmail = logged[0].email ? String(logged[0].email) : customerEmail;
      } else customerId = null;
    }

    if (!customerId && customerName && customerPhone) {
      const existing = await db.sql`SELECT id FROM customers WHERE phone=${customerPhone} LIMIT 1`;
      if (existing.length) {
        customerId = String(existing[0].id);
        await db.sql`UPDATE customers SET name=${customerName}, email=COALESCE(${customerEmail}, email), updated_at=NOW() WHERE id=${customerId}`;
      } else {
        customerId = crypto.randomUUID();
        await db.sql`INSERT INTO customers (id,name,phone,email,city) VALUES (${customerId},${customerName},${customerPhone},${customerEmail},'Goiânia - GO')`;
      }
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const id = crypto.randomUUID();
    const orderNumber = makeOrderNumber();
    await db.sql`INSERT INTO orders (id,order_number,customer_id,customer_name,items,total,status,source) VALUES (${id},${orderNumber},${customerId},${customerName},${JSON.stringify(items)}::jsonb,${total},'novo','whatsapp')`;

    const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
    const lines = [`Olá! Gostaria de solicitar o orçamento ${orderNumber} na Vitória Informática:`, customerName ? `Cliente: ${customerName}` : "", customerPhone ? `WhatsApp: ${customerPhone}` : "", "", ...items.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.subtotal)}`), "", `Total estimado: ${money.format(total)}`, "", "Por favor, confirme disponibilidade, garantia e condições de retirada/entrega em Goiânia."].filter(Boolean);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
    return NextResponse.json({ ok:true, orderNumber, total, customerId, whatsappUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível registrar o orçamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
