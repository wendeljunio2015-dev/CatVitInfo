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
const statusClass: Record<string, string> = {
  novo: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  em_atendimento: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  concluido: "text-green-300 bg-green-500/10 border-green-500/20",
  cancelado: "text-red-300 bg-red-500/10 border-red-500/20",
  aguardando_pagamento: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  pago: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  pago_revisao_estoque: "text-orange-300 bg-orange-500/10 border-orange-500/20",
  pagamento_recusado: "text-red-300 bg-red-500/10 border-red-500/20",
  cancelled: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
  refunded: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  charged_back: "text-red-300 bg-red-500/10 border-red-500/20",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const db = getDatabase();
  const orders = await db.sql`
    SELECT o.id, o.order_number, o.customer_id, o.customer_name, o.items, o.total, o.status, o.source,
           o.stock_deducted_at, o.seller_id, o.seller_name, o.seller_commission_rate,
           o.commission_amount, o.created_at,
           p.provider_payment_id, p.status AS payment_status, p.status_detail AS payment_status_detail,
           p.payment_method, p.installments, p.amount AS payment_amount, p.approved_at
    FROM orders o
    LEFT JOIN LATERAL (
      SELECT provider_payment_id, status, status_detail, payment_method, installments, amount, approved_at
      FROM payments
      WHERE order_id = o.id
      ORDER BY created_at DESC
      LIMIT 1
    ) p ON TRUE
    ORDER BY o.created_at DESC LIMIT 100
  `;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const openCount = orders.filter((order: any) => ["novo", "em_atendimento", "aguardando_pagamento"].includes(String(order.status))).length;
  const paidCount = orders.filter((order: any) => String(order.payment_status) === "approved").length;
  const completedCount = orders.filter((order: any) => String(order.status) === "concluido").length;
  const totalPaid = orders.reduce((sum: number, order: any) => sum + (String(order.payment_status) === "approved" ? Number(order.payment_amount || 0) : 0), 0);

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div className="min-w-0"><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Pedidos e orçamentos</h1><p className="mt-3 text-zinc-400">Acompanhe vendas, pagamentos, vendedores e comissões.</p></div><div className="flex flex-wrap items-center gap-2 text-sm"><Link href="/admin/vendedores" className="rounded-lg border border-green-500/30 px-3 py-2 font-bold text-green-300">Vendedores</Link><Link href="/admin/clientes" className="rounded-lg bg-blue-600 px-3 py-2 font-bold hover:bg-blue-500">Clientes</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold hover:bg-zinc-800">← Painel</Link></div></div>
    {error ? <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">{error}</div> : null}
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Em aberto</p><p className="mt-2 text-4xl font-black text-amber-400">{openCount}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Pagamentos aprovados</p><p className="mt-2 text-4xl font-black text-emerald-400">{paidCount}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Concluídos</p><p className="mt-2 text-4xl font-black text-green-400">{completedCount}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Recebido Mercado Pago</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(totalPaid)}</p></div></div>
    <section className="mt-10 space-y-4">{orders.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Nenhum pedido registrado ainda.</div> : orders.map((order: any) => { const items = Array.isArray(order.items) ? order.items : []; const stockDeducted = Boolean(order.stock_deducted_at); const isMercadoPago = String(order.source) === "mercado_pago"; const canFinishPaid = isMercadoPago && ["pago", "pago_revisao_estoque"].includes(String(order.status)); return <article key={String(order.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-black">{String(order.order_number)}</h2><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[String(order.status)] || "border-zinc-700 text-zinc-300"}`}>{statusLabel[String(order.status)] || String(order.status)}</span>{stockDeducted ? <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">Estoque baixado</span> : null}</div><p className="mt-2 text-sm text-zinc-400">{order.customer_name ? <>Cliente: {order.customer_id ? <Link href={`/admin/clientes/${encodeURIComponent(String(order.customer_id))}/editar`} className="font-bold text-blue-300 hover:underline">{String(order.customer_name)}</Link> : String(order.customer_name)} • </> : null}{date.format(new Date(String(order.created_at)))}</p>{order.seller_name ? <p className="mt-2 text-sm font-bold text-green-300">Vendedor: {String(order.seller_name)} • Comissão {Number(order.seller_commission_rate || 0).toFixed(2).replace(".",",")}%{order.commission_amount != null ? ` • ${money.format(Number(order.commission_amount))}` : ""}</p> : <p className="mt-2 text-xs text-zinc-500">Venda direta da loja</p>}</div><strong className="text-2xl text-blue-400">{money.format(Number(order.total))}</strong></div>
      <div className="mt-5 space-y-2 rounded-xl bg-zinc-950 p-4">{items.map((item: any, index: number) => <div key={`${String(item.productId)}-${index}`} className="flex justify-between gap-4 text-sm"><span>{Number(item.quantity)}x {String(item.name)}</span><span className="font-bold">{money.format(Number(item.subtotal))}</span></div>)}</div>
      {order.provider_payment_id ? <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm"><p className="font-black text-emerald-300">Pagamento Mercado Pago</p><div className="mt-2 grid gap-1 text-zinc-300 sm:grid-cols-2"><span>ID: <strong>{String(order.provider_payment_id)}</strong></span><span>Status: <strong>{String(order.payment_status || "-")}</strong></span><span>Forma: <strong>{String(order.payment_method) === "pix" ? "Pix" : `Cartão (${String(order.payment_method || "-")})`}</strong></span><span>{String(order.payment_method) === "pix" ? "Pagamento à vista" : `Parcelas: ${Number(order.installments || 1)}x`}</span><span>Valor: <strong>{money.format(Number(order.payment_amount || 0))}</strong></span>{order.approved_at ? <span>Aprovado: <strong>{date.format(new Date(String(order.approved_at)))}</strong></span> : null}</div></div> : null}
      {String(order.status) === "pago_revisao_estoque" ? <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm font-bold text-orange-200">Pagamento já aprovado, mas o estoque não pôde ser baixado automaticamente. Confira/reponha o estoque antes de concluir.</div> : null}
      {canFinishPaid ? <form action={`/api/admin/orders/${encodeURIComponent(String(order.id))}`} method="post" className="mt-5 flex flex-wrap items-center gap-2"><input type="hidden" name="status" value="concluido"/><button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black hover:bg-emerald-500">Confirmar separação / concluir venda</button><span className="text-xs text-zinc-500">O pagamento já está aprovado. Cancelamentos e reembolsos devem ser feitos pelo fluxo do Mercado Pago.</span></form> : isMercadoPago ? <p className="mt-5 text-xs text-zinc-500">Status financeiro sincronizado automaticamente pelo Mercado Pago.</p> : <form action={`/api/admin/orders/${encodeURIComponent(String(order.id))}`} method="post" className="mt-5 flex flex-wrap items-center gap-2"><select name="status" defaultValue={String(order.status)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold"><option value="novo">Novo</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select><button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-black hover:bg-blue-500">{stockDeducted ? "Atualizar status" : "Atualizar / confirmar venda"}</button>{!stockDeducted ? <span className="text-xs text-zinc-500">Ao concluir, baixa estoque e calcula a comissão uma única vez.</span> : <span className="text-xs text-green-400">Venda concluída. Ao cancelar, o sistema restaura o estoque e reverte a comissão.</span>}</form>}
    </article>; })}</section>
  </main>;
}
