import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { getAuthenticatedCustomerId } from "@/lib/customer-auth";
import { getSellerRef } from "@/lib/seller-ref";
import { QUOTE_DRAFT_COOKIE, QUOTE_DRAFT_MAX_AGE, signQuoteDraft } from "@/lib/quote-draft";

type RequestedItem = { productId?: string; quantity?: number };

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requestedItems = Array.isArray(body.items) ? (body.items as RequestedItem[]) : [];
    let customerName = String(body.customerName || "").trim().slice(0, 120) || null;
    let customerPhone = normalizePhone(String(body.customerPhone || "")) || null;
    let customerEmail = String(body.customerEmail || "").trim().toLowerCase().slice(0, 180) || null;

    const normalized = requestedItems
      .map((item) => ({
        productId: String(item.productId || "").trim(),
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      }))
      .filter((item) => item.productId);

    if (!normalized.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });

    const db = getDatabase();
    const ids = normalized.map((item) => item.productId);
    const rows = await db.sql`SELECT id, name, stock_quantity FROM products WHERE id = ANY(${ids}::text[])`;
    const productMap = new Map(rows.map((row: any) => [String(row.id), row]));

    for (const requested of normalized) {
      const product = productMap.get(requested.productId) as any;
      if (!product) return NextResponse.json({ error: "Um produto do carrinho não está mais disponível no catálogo. Remova-o e tente novamente." }, { status: 409 });
      const available = Number(product.stock_quantity ?? 0);
      if (available <= 0) return NextResponse.json({ error: `${String(product.name)} está indisponível no momento. Remova o item do carrinho.` }, { status: 409 });
      if (requested.quantity > available) return NextResponse.json({ error: `${String(product.name)} possui apenas ${available} unidade(s) disponível(is). Ajuste a quantidade no carrinho.` }, { status: 409 });
    }

    let customerId = await getAuthenticatedCustomerId();
    if (customerId) {
      const logged = await db.sql`SELECT id,name,phone,email FROM customers WHERE id=${customerId} LIMIT 1`;
      if (logged.length) {
        customerName = String(logged[0].name || customerName || "Cliente");
        customerPhone = logged[0].phone ? String(logged[0].phone) : customerPhone;
        customerEmail = logged[0].email ? String(logged[0].email) : customerEmail;
      } else {
        customerId = null;
      }
    }

    const sellerRef = await getSellerRef();
    const token = signQuoteDraft({
      customerName,
      customerPhone,
      customerEmail,
      customerId,
      sellerRef,
      items: normalized,
      expiresAt: Date.now() + QUOTE_DRAFT_MAX_AGE * 1000,
    });

    const response = NextResponse.json({
      ok: true,
      whatsappUrl: new URL("/api/orders/open", request.url).toString(),
    });
    response.cookies.set(QUOTE_DRAFT_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: QUOTE_DRAFT_MAX_AGE,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível preparar o orçamento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
