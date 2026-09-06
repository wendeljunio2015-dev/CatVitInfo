import { getDatabase } from "@netlify/database";
import { queueAndSendApprovedOrderNotification } from "@/lib/whatsapp-cloud";

export type MercadoPagoPayment = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  date_approved?: string | null;
  date_last_updated?: string | null;
  three_ds_info?: { external_resource_url?: string; creq?: string } | null;
  point_of_interaction?: unknown;
};

type OrderItem = { productId?: string; quantity?: number; name?: string };

async function notifyApprovedOrder(orderId: string) {
  try {
    await queueAndSendApprovedOrderNotification(orderId);
  } catch (error) {
    console.error("WhatsApp seller notification error", error);
  }
}

export async function reconcileMercadoPagoPayment(payment: MercadoPagoPayment) {
  const externalReference = String(payment.external_reference || "").trim();
  if (!externalReference) return { matched: false, approved: false, stockDeducted: false };

  const paymentId = String(payment.id || "").trim() || null;
  const paymentStatus = String(payment.status || "").trim() || null;
  const paymentAmount = Number(payment.transaction_amount || 0);
  const db = getDatabase();
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id, order_number, items, total, status, seller_id, seller_commission_rate,
              stock_deducted_at, stock_restored_at
       FROM orders
       WHERE id = $1 OR order_number = $1
       LIMIT 1
       FOR UPDATE`,
      [externalReference],
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return { matched: false, approved: false, stockDeducted: false };
    }

    const order = result.rows[0] as {
      id: string;
      order_number: string;
      items: OrderItem[];
      total: number | string;
      status: string;
      seller_id: string | null;
      seller_commission_rate: number | string | null;
      stock_deducted_at: string | null;
      stock_restored_at: string | null;
    };

    const expectedTotal = Number(order.total);
    const amountMatches = Number.isFinite(paymentAmount) && Math.abs(expectedTotal - paymentAmount) < 0.01;

    await client.query(
      `UPDATE orders
       SET payment_provider = 'mercado_pago',
           payment_id = COALESCE($1, payment_id),
           payment_status = $2,
           payment_status_detail = $3,
           payment_method_id = $4,
           payment_type_id = $5,
           payment_external_reference = $6,
           payment_amount = $7,
           payment_approved_at = $8,
           payment_updated_at = $9,
           updated_at = NOW()
       WHERE id = $10`,
      [
        paymentId,
        paymentStatus,
        String(payment.status_detail || "").trim() || null,
        String(payment.payment_method_id || "").trim() || null,
        String(payment.payment_type_id || "").trim() || null,
        externalReference,
        Number.isFinite(paymentAmount) ? paymentAmount : null,
        payment.date_approved || null,
        payment.date_last_updated || new Date().toISOString(),
        order.id,
      ],
    );

    if (paymentStatus !== "approved" || order.stock_deducted_at) {
      if (["rejected", "cancelled"].includes(paymentStatus || "") && !order.stock_deducted_at) {
        await client.query("UPDATE orders SET status = 'cancelado', updated_at = NOW() WHERE id = $1", [order.id]);
      }
      await client.query("COMMIT");
      if (paymentStatus === "approved" && order.stock_deducted_at) await notifyApprovedOrder(order.id);
      return { matched: true, approved: paymentStatus === "approved", stockDeducted: Boolean(order.stock_deducted_at), amountMatches };
    }

    if (!amountMatches) {
      await client.query("UPDATE orders SET status = 'em_atendimento', updated_at = NOW() WHERE id = $1", [order.id]);
      await client.query("COMMIT");
      return { matched: true, approved: true, stockDeducted: false, amountMatches: false, needsReview: true };
    }

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const productId = String(item.productId || "");
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const productResult = await client.query("SELECT id, name, stock_quantity FROM products WHERE id = $1 FOR UPDATE", [productId]);
      if (!productResult.rows.length) {
        await client.query("UPDATE orders SET status = 'em_atendimento', updated_at = NOW() WHERE id = $1", [order.id]);
        await client.query("COMMIT");
        return { matched: true, approved: true, stockDeducted: false, amountMatches: true, needsReview: true };
      }
      const available = Number(productResult.rows[0].stock_quantity || 0);
      if (available < quantity) {
        await client.query("UPDATE orders SET status = 'em_atendimento', updated_at = NOW() WHERE id = $1", [order.id]);
        await client.query("COMMIT");
        return { matched: true, approved: true, stockDeducted: false, amountMatches: true, needsReview: true };
      }
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
      ? Math.round((expectedTotal * Number(order.seller_commission_rate) / 100) * 100) / 100
      : null;

    await client.query(
      `UPDATE orders
       SET status = 'concluido',
           stock_deducted_at = COALESCE(stock_deducted_at, NOW()),
           stock_restored_at = NULL,
           commission_amount = $1,
           commission_reversed_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [commissionAmount, order.id],
    );

    await client.query("COMMIT");
    await notifyApprovedOrder(order.id);
    return { matched: true, approved: true, stockDeducted: true, amountMatches: true };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
