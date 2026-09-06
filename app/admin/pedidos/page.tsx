import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Pedidos e Orçamentos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  pago_revisao_estoque: "Pago — revisar estoque",
  pagamento_recusado: "Pagamento recusado",
  cancelled: "Pagamento cancelado",
  refunded: "Reembolsado",
  charged_back: "Chargeback",
};

export default async function OrdersPage() {
  await requireAdmin();
  const db = getDatabase();
  const orders = await db.sql`
    SELECT o.id,o.order_number,o.customer_id,o.customer_name,o.items,o.total,o.status,o.source,
           o.stock_deducted_at,o.seller_name,o.seller_commission_rate,o.commission_amount,o.created_at,
           p.provider_payment_id,p.status AS payment_status,p.payment_method,p.installments,p.amount AS payment_amount,p.approved_at
    FROM orders o
    LEFT JOIN LATERAL (
      SELECT provider_payment_id,status,payment_method,installments,amount,approved_at
      FROM payments
      WHERE order_id=o.id
      ORDER BY created_at DESC
      LIMIT 1
    ) p ON TRUE
    ORDER BY o.created_at DESC
    LIMIT 100
  `;

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const paid = orders.filter((order: any) => String(order.payment_status) === "approved");
  const totalPaid = paid.reduce((sum: number, order: any) => sum + Number(order.payment_amount || 0), 0);

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black">Pedidos e vendas</h1><p className="mt-2 text-zinc-400">Pedidos, pagamentos Mercado Pago, estoque e comissões.</p></div>
      <Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold">← Painel</Link>
    </div>

    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pedidos</p><p className="mt-2 text-3xl font-black">{orders.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Pagamentos aprovados</p><p className="mt-2 text-3xl font-black text-emerald-400">{paid.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Recebido Mercado Pago</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(totalPaid)}</p></div>
    </div>

    <section className="mt-8 space-y-4">
      {orders.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Nenhum pedido registrado nesta base.</div> : orders.map((order: any) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return <article key={String(order.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-wrap justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black">{String(order.order_number)}</h2><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-bold">{statusLabel[String(order.status)] || String(order.status)}</span>{order.stock_deducted_at ? <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">Estoque baixado</span> : null}</div><p className="mt-2 text-sm text-zinc-400">{String(order.customer_name || "Cliente não informado")} • {date.format(new Date(String(order.created_at)))}</p>{order.seller_name ? <p className="mt-1 text-sm text-green-300">Vendedor: {String(order.seller_name)}</p> : null}</div><strong className="text-2xl text-blue-400">{money.format(Number(order.total || 0))}</strong></div>

          <div className="mt-4 space-y-2 rounded-xl bg-zinc-950 p-4">{items.map((item: any, index: number) => <div key={`${String(item.productId)}-${index}`} className="flex justify-between gap-4 text-sm"><span>{Number(item.quantity)}x {String(item.name)}</span><span className="font-bold">{money.format(Number(item.subtotal || 0))}</span></div>)}</div>

          {order.provider_payment_id ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm"><p className="font-black text-emerald-300">Pagamento Mercado Pago</p><div className="mt-2 grid gap-1 text-zinc-300 sm:grid-cols-2"><span>ID: <strong>{String(order.provider_payment_id)}</strong></span><span>Status: <strong>{String(order.payment_status || "-")}</strong></span><span>Forma: <strong>{String(order.payment_method) === "pix" ? "Pix" : `Cartão (${String(order.payment_method || "-")})`}</strong></span><span>{String(order.payment_method) === "pix" ? "À vista" : `Parcelas: ${Number(order.installments || 1)}x`}</span><span>Valor: <strong>{money.format(Number(order.payment_amount || 0))}</strong></span>{order.approved_at ? <span>Aprovado: <strong>{date.format(new Date(String(order.approved_at)))}</strong></span> : null}</div></div> : <p className="mt-4 text-xs text-zinc-500">Sem transação Mercado Pago vinculada.</p>}

          {String(order.status) === "pago_revisao_estoque" ? <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm font-bold text-orange-200">Pagamento aprovado, mas o estoque precisa de revisão manual.</div> : null}
        </article>;
      })}
    </section>
  </main>;
}
