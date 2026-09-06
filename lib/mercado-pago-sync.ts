import { getDatabase } from "@netlify/database";

type OrderItem = { productId?: string; quantity?: number; name?: string };

function normalizeItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function syncMercadoPagoPayment(payment: any, expectedOrderId?: string) {
  const paymentId = String(payment?.id || "").trim();
  const orderNumber = String(payment?.external_reference || "").trim();
  if (!paymentId || !orderNumber) throw new Error("Pagamento sem identificação do pedido.");

  const db = getDatabase();
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = expectedOrderId
      ? await client.query(
          `SELECT id, order_number, items, total, status, seller_id, seller_commission_rate,
                  commission_amount, stock_deducted_at, stock_restored_at
           FROM orders WHERE id = $1 FOR UPDATE`,
          [expectedOrderId],
        )
      : await client.query(
          `SELECT id, order_number, items, total, status, seller_id, seller_commission_rate,
                  commission_amount, stock_deducted_at, stock_restored_at
           FROM orders WHERE order_number = $1 FOR UPDATE`,
          [orderNumber],
        );

    if (!orderResult.rows.length) throw new Error("Pedido não encontrado para o pagamento.");
    const order = orderResult.rows[0] as any;
    if (String(order.order_number) !== orderNumber) throw new Error("Pagamento não pertence a este pedido.");

    const paidAmount = Number(payment.transaction_amount || 0);
    if (Math.abs(paidAmount - Number(order.total || 0)) > 0.009) throw new Error("Valor do pagamento diverge do pedido.");

    const status = String(payment.status || "unknown");
    const statusDetail = payment.status_detail ? String(payment.status_detail) : null;
    const paymentMethod = payment.payment_method_id ? String(payment.payment_method_id) : null;
    const installments = Number.isFinite(Number(payment.installments)) ? Number(payment.installments) : null;
    const currency = String(payment.currency_id || "BRL");
    const approvedAt = payment.date_approved ? new Date(payment.date_approved) : null;

    await client.query(
      `INSERT INTO payments (
         id, order_id, provider, provider_payment_id, status, status_detail,
         payment_method, installments, amount, currency, approved_at, updated_at
       ) VALUES ($1,$2,'mercado_pago',$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (provider, provider_payment_id) DO UPDATE SET
         order_id = EXCLUDED.order_id,
         status = EXCLUDED.status,
         status_detail = EXCLUDED.status_detail,
         payment_method = EXCLUDED.payment_method,
         installments = EXCLUDED.installments,
         amount = EXCLUDED.amount,
         currency = EXCLUDED.currency,
         approved_at = EXCLUDED.approved_at,
         updated_at = NOW()`,
      [`mercado_pago:${paymentId}`, order.id, paymentId, status, statusDetail, paymentMethod, installments, paidAmount, currency, approvedAt],
    );

    let orderStatus = "aguardando_pagamento";

    if (status === "approved") {
      if (!order.stock_deducted_at) {
        const items = normalizeItems(order.items);
        let stockIssue = false;
        const lockedProducts: Array<{ id: string; quantity: number }> = [];

        for (const item of items) {
          const productId = String(item.productId || "");
          const quantity = Math.max(1, Number(item.quantity) || 1);
          if (!productId) { stockIssue = true; break; }
          const productResult = await client.query("SELECT id, name, stock_quantity FROM products WHERE id = $1 FOR UPDATE", [productId]);
          if (!productResult.rows.length || Number(productResult.rows[0].stock_quantity) < quantity) { stockIssue = true; break; }
          lockedProducts.push({ id: productId, quantity });
        }

        if (stockIssue) {
          orderStatus = "pago_revisao_estoque";
          await client.query("UPDATE orders SET status = $1, source = 'mercado_pago', updated_at = NOW() WHERE id = $2", [orderStatus, order.id]);
        } else {
          for (const product of lockedProducts) {
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
              [product.quantity, product.id],
            );
          }
          const commissionAmount = order.seller_id && order.seller_commission_rate !== null
            ? Math.round((Number(order.total) * Number(order.seller_commission_rate) / 100) * 100) / 100
            : null;
          orderStatus = "pago";
          await client.query(
            `UPDATE orders
             SET status = $1, source = 'mercado_pago', stock_deducted_at = NOW(), stock_restored_at = NULL,
                 commission_amount = $2, commission_reversed_at = NULL, updated_at = NOW()
             WHERE id = $3`,
            [orderStatus, commissionAmount, order.id],
          );
        }
      } else {
        orderStatus = "pago";
        await client.query("UPDATE orders SET status = $1, source = 'mercado_pago', updated_at = NOW() WHERE id = $2", [orderStatus, order.id]);
      }
    } else if (["cancelled", "refunded", "charged_back"].includes(status)) {
      orderStatus = status;
      if (order.stock_deducted_at && !order.stock_restored_at) {
        for (const item of normalizeItems(order.items)) {
          const productId = String(item.productId || "");
          const quantity = Math.max(1, Number(item.quantity) || 1);
          if (!productId) continue;
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
           SET status = $1, source = 'mercado_pago', stock_deducted_at = NULL, stock_restored_at = NOW(),
               commission_amount = NULL, commission_reversed_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [orderStatus, order.id],
        );
      } else {
        await client.query("UPDATE orders SET status = $1, source = 'mercado_pago', updated_at = NOW() WHERE id = $2", [orderStatus, order.id]);
      }
    } else {
      orderStatus = status === "rejected" ? "pagamento_recusado" : "aguardando_pagamento";
      await client.query("UPDATE orders SET status = $1, source = 'mercado_pago', updated_at = NOW() WHERE id = $2", [orderStatus, order.id]);
    }

    await client.query("COMMIT");
    return { orderId: String(order.id), orderNumber: String(order.order_number), orderStatus };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
