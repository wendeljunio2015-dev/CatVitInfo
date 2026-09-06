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
    const orderResult = await client.query(
      "SELECT id, items, total, status, source, seller_id, seller_commission_rate, commission_amount, stock_deducted_at, stock_restored_at FROM orders WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!orderResult.rows.length) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const order = orderResult.rows[0] as {
      items: OrderItem[];
      total: number;
      status: string;
      source: string;
      seller_id: string | null;
      seller_commission_rate: number | null;
      commission_amount: number | null;
      stock_deducted_at: string | null;
      stock_restored_at: string | null;
    };
    const items = Array.isArray(order.items) ? order.items : [];

    if (order.source === "mercado_pago") {
      const canFinish = ["pago", "pago_revisao_estoque"].includes(String(order.status)) && status === "concluido";
      const noChange = String(order.status) === "concluido" && status === "concluido";
      if (!canFinish && !noChange) {
        throw new Error("Pedidos do Mercado Pago têm o status financeiro sincronizado automaticamente. Para cancelar uma venda paga, faça o reembolso/estorno pelo Mercado Pago; não altere o pedido manualmente.");
      }
    }

    if (order.stock_deducted_at && !order.stock_restored_at && !["concluido", "cancelado"].includes(status)) {
      throw new Error("Venda concluída não pode voltar para um status aberto. Cancele a venda para restaurar estoque e comissão com segurança.");
    }

    if (status === "cancelado" && order.stock_deducted_at && !order.stock_restored_at) {
      if (order.seller_id) {
        const paid = await client.query(
          `SELECT COALESCE(SUM(paid_amount), 0)::numeric AS paid
           FROM commission_settlements
           WHERE seller_id = $1
             AND period_month = date_trunc('month', $2::timestamptz)::date`,
          [order.seller_id, order.stock_deducted_at],
        );
        if (Number(paid.rows[0]?.paid || 0) > 0) {
          throw new Error("Não é possível cancelar automaticamente: já existe pagamento de comissão para este vendedor no mês desta venda. Ajuste a comissão antes de cancelar.");
        }
      }

      for (const item of items) {
        const productId = String(item.productId || "");
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const productResult = await client.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [productId]);
        if (!productResult.rows.length) throw new Error(`Produto do pedido não encontrado: ${String(item.name || productId)}`);
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity + $1,
               stock_status = CASE
                 WHEN stock_quantity + $1 <= 0 THEN 'indisponivel'
                 WHEN stock_quantity + $1 <= 2 THEN 'ultimas_unidades'
                 ELSE 'em_estoque'
               END,
               updated_at = NOW()
           WHERE id = $2`,
          [quantity, productId],
        );
      }

      await client.query(
        `UPDATE orders
         SET status = 'cancelado',
             stock_deducted_at = NULL,
             stock_restored_at = NOW(),
             commission_amount = NULL,
             commission_reversed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [id],
      );
    } else if (status === "concluido" && !order.stock_deducted_at) {
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

      const commissionAmount = order.seller_id && order.seller_commission_rate !== null
        ? Math.round((Number(order.total) * Number(order.seller_commission_rate) / 100) * 100) / 100
        : null;
      await client.query(
        `UPDATE orders
         SET status = 'concluido', stock_deducted_at = NOW(), stock_restored_at = NULL,
             commission_amount = $1, commission_reversed_at = NULL, updated_at = NOW()
         WHERE id = $2`,
        [commissionAmount, id],
      );
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
