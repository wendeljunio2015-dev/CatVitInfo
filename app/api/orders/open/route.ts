import { getDatabase } from "@netlify/database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { QUOTE_DRAFT_COOKIE, verifyQuoteDraft } from "@/lib/quote-draft";

const storeWhatsApp = "5562994780830";

function makeOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `VI-${date}-${suffix}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const draft = verifyQuoteDraft(cookieStore.get(QUOTE_DRAFT_COOKIE)?.value || null);
  const requestUrl = new URL(request.url);

  if (!draft) {
    return new NextResponse("Orçamento expirado. Volte ao carrinho e tente novamente.", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (requestUrl.searchParams.get("confirm") !== "1") {
    const confirmUrl = new URL(request.url);
    confirmUrl.searchParams.set("confirm", "1");
    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirmar orçamento</title></head>
<body style="margin:0;background:#09090b;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px">
<main style="max-width:560px;width:100%;background:#18181b;border:1px solid #27272a;border-radius:20px;padding:28px;box-sizing:border-box;text-align:center">
<h1 style="margin:0 0 12px;font-size:28px">Confirmar orçamento</h1>
<p style="color:#a1a1aa;line-height:1.6">O orçamento só será registrado no painel quando você clicar no botão abaixo para seguir ao WhatsApp.</p>
<a href="${escapeHtml(confirmUrl.toString())}" style="display:inline-block;margin-top:20px;background:#16a34a;color:white;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:12px">Abrir WhatsApp e registrar orçamento</a>
<p style="margin-top:16px;color:#71717a;font-size:13px">Se fechar esta página agora, nenhum orçamento será contado.</p>
</main></body></html>`;
    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }

  const db = getDatabase();
  const ids = draft.items.map((item) => item.productId);
  const rows = await db.sql`SELECT id,name,price,cost_price,stock_quantity FROM products WHERE id = ANY(${ids}::text[])`;
  const productMap = new Map(rows.map((row: any) => [String(row.id), row]));
  const items = [] as Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number; unitCost: number | null; costSubtotal: number | null }>;

  for (const requested of draft.items) {
    const product = productMap.get(requested.productId) as any;
    if (!product) return NextResponse.redirect(new URL("/carrinho", request.url), 302);
    const available = Number(product.stock_quantity ?? 0);
    if (available <= 0 || requested.quantity > available) return NextResponse.redirect(new URL("/carrinho", request.url), 302);
    const unitPrice = Number(product.price);
    const unitCost = product.cost_price == null ? null : Number(product.cost_price);
    items.push({ productId: requested.productId, name: String(product.name), quantity: requested.quantity, unitPrice, subtotal: unitPrice * requested.quantity, unitCost, costSubtotal: unitCost == null ? null : unitCost * requested.quantity });
  }

  let customerId = draft.customerId;
  let customerName = draft.customerName;
  let customerPhone = draft.customerPhone;
  let customerEmail = draft.customerEmail;

  if (customerId) {
    const logged = await db.sql`SELECT id,name,phone,email FROM customers WHERE id=${customerId} LIMIT 1`;
    if (!logged.length) customerId = null;
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

  let sellerId: string | null = null;
  let sellerName: string | null = null;
  let sellerCommissionRate: number | null = null;
  let whatsappNumber = storeWhatsApp;

  if (draft.sellerRef) {
    const sellerRows = await db.sql`SELECT id,name,phone,commission_rate FROM sellers WHERE id=${draft.sellerRef} AND active=TRUE LIMIT 1`;
    if (sellerRows.length) {
      sellerId = String(sellerRows[0].id);
      sellerName = String(sellerRows[0].name);
      sellerCommissionRate = Number(sellerRows[0].commission_rate);
      whatsappNumber = String(sellerRows[0].phone || storeWhatsApp).replace(/\D/g, "");
    }
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const id = crypto.randomUUID();
  const orderNumber = makeOrderNumber();
  await db.sql`INSERT INTO orders (id,order_number,customer_id,customer_name,items,total,status,source,seller_id,seller_name,seller_commission_rate) VALUES (${id},${orderNumber},${customerId},${customerName},${JSON.stringify(items)}::jsonb,${total},'novo','whatsapp',${sellerId},${sellerName},${sellerCommissionRate})`;

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const lines = [`Olá! Gostaria de solicitar o orçamento ${orderNumber} na Vitória Informática:`, sellerName ? `Atendimento: ${sellerName}` : "", customerName ? `Cliente: ${customerName}` : "", customerPhone ? `WhatsApp: ${customerPhone}` : "", "", ...items.map((item) => `• ${item.quantity}x ${item.name} — ${money.format(item.subtotal)}`), "", `Total estimado: ${money.format(total)}`, "", "Por favor, confirme disponibilidade, garantia e condições de retirada/entrega em Goiânia."].filter(Boolean);
  const target = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  const response = NextResponse.redirect(target, 302);
  response.cookies.set(QUOTE_DRAFT_COOKIE, "", { path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
