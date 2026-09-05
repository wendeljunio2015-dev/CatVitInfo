import { getDatabase } from "@netlify/database";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type OrderItem = { productId?: string; quantity?: number; name?: string };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const data = await request.formData();
  const status = String(data.get("status") || "");
  if (!["novo", "em_atendimento", "concluido", "cancelado"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const db = getDatabase();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query("SELECT id, items, stock_deducted_at FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!orderResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const order = orderResult.rows[0] as { items: OrderItem[]; stock_deducted_at: string | null };
    if (status === "concluido" && !order.stock_deducted_at) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const productId = String(item.productId || "");
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const productResult = await client.query("SELECT id, name, stock_quantity FROM products WHERE id = $1 FOR UPDATE", [productId]);
        if (!productResult.rows.length) throw new Error(`Produto do pedido não encontrado: ${String(item.name || productId)}`);
        const product = productResult.rows[0] as { name: string; stock_quantity: number };
        if (Number(product.stock_quantity) < quantity) throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock_quantity}, necessário: ${quantity}.`);
      }

      for (const item of items) {
        const productId = String(item.productId || "");
        const quantity = Math.max(1, Number(item.quantity) || 1);
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity - $1,
               stock_status = CASE
                 WHEN stock_quantity - $1 <= 0 THEN 'indisponivel'
                 WHEN stock_quantity - $1 <= 2 THEN 'ultimas_unidades'
                 ELSE 'em_estoque'
               END,
               updated_at = NOW()
           WHERE id = $2`,
          [quantity, productId],
        );
      }

      await client.query("UPDATE orders SET status = $1, stock_deducted_at = NOW(), updated_at = NOW() WHERE id = $2", [status, id]);
    } else {
      await client.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
    }

    await client.query("COMMIT");
    return NextResponse.redirect(new URL("/admin/pedidos", request.url), 303);
  } catch (error) {
    await client.query("ROLLBACK");
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o pedido.";
    return NextResponse.redirect(new URL(`/admin/pedidos?error=${encodeURIComponent(message)}`, request.url), 303);
  } finally {
    client.release();
  }
}
