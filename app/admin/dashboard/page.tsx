import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Dashboard Gerencial", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function validMonth(value?: string) {
  return value && /^\d{4}-\d{2}$/.test(value) && Number(value.slice(5, 7)) >= 1 && Number(value.slice(5, 7)) <= 12;
}

export default async function ManagementDashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const month = validMonth(params.month) ? String(params.month) : new Date().toISOString().slice(0, 7);
  const periodMonth = `${month}-01`;
  const db = getDatabase();

  const [summary] = await db.sql`
    SELECT
      COUNT(*) FILTER (WHERE status='concluido')::int AS sales_count,
      COALESCE(SUM(total) FILTER (WHERE status='concluido'),0)::numeric AS revenue,
      COALESCE(AVG(total) FILTER (WHERE status='concluido'),0)::numeric AS avg_ticket,
      COALESCE(SUM(commission_amount) FILTER (WHERE status='concluido'),0)::numeric AS commission_generated,
      COUNT(*) FILTER (WHERE status IN ('novo','em_atendimento'))::int AS open_quotes
    FROM orders
    WHERE (
      status='concluido'
      AND stock_deducted_at >= ${periodMonth}::date
      AND stock_deducted_at < (${periodMonth}::date + INTERVAL '1 month')
    ) OR (
      status IN ('novo','em_atendimento')
      AND created_at >= ${periodMonth}::date
      AND created_at < (${periodMonth}::date + INTERVAL '1 month')
    )
  `;

  const [paidRow] = await db.sql`
    SELECT COALESCE(SUM(paid_amount),0)::numeric AS paid_commissions
    FROM commission_settlements
    WHERE period_month=${periodMonth}::date
  `;

  const sellerRanking = await db.sql`
    SELECT
      COALESCE(seller_name,'Venda direta') AS seller_name,
      seller_id,
      COUNT(*)::int AS sales_count,
      COALESCE(SUM(total),0)::numeric AS sales_total,
      COALESCE(SUM(commission_amount),0)::numeric AS commission_total
    FROM orders
    WHERE status='concluido'
      AND stock_deducted_at >= ${periodMonth}::date
      AND stock_deducted_at < (${periodMonth}::date + INTERVAL '1 month')
    GROUP BY seller_id, seller_name
    ORDER BY sales_total DESC, sales_count DESC
  `;

  const topProducts = await db.sql`
    SELECT
      item->>'productId' AS product_id,
      item->>'name' AS product_name,
      COALESCE(SUM((item->>'quantity')::int),0)::int AS units_sold,
      COALESCE(SUM((item->>'subtotal')::numeric),0)::numeric AS sales_total
    FROM orders
    CROSS JOIN LATERAL jsonb_array_elements(items) AS item
    WHERE status='concluido'
      AND stock_deducted_at >= ${periodMonth}::date
      AND stock_deducted_at < (${periodMonth}::date + INTERVAL '1 month')
    GROUP BY item->>'productId', item->>'name'
    ORDER BY units_sold DESC, sales_total DESC
    LIMIT 10
  `;

  const stockSummary = await db.sql`
    SELECT
      COUNT(*) FILTER (WHERE stock_quantity > 0)::int AS products_available,
      COUNT(*) FILTER (WHERE stock_quantity BETWEEN 1 AND 2)::int AS low_stock_products,
      COUNT(*) FILTER (WHERE stock_quantity = 0)::int AS out_of_stock_products,
      COALESCE(SUM(stock_quantity),0)::int AS total_units
    FROM products
  `;

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${periodMonth}T12:00:00Z`));
  const revenue = Number(summary?.revenue || 0);
  const commissionGenerated = Number(summary?.commission_generated || 0);
  const paidCommissions = Number(paidRow?.paid_commissions || 0);
  const directSales = sellerRanking.filter((row: any) => !row.seller_id).reduce((sum: number, row: any) => sum + Number(row.sales_total || 0), 0);
  const sellerSales = revenue - directSales;
  const stock = stockSummary[0] as any;

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Dashboard gerencial</h1><p className="mt-3 text-zinc-400">Visão consolidada de vendas, vendedores, comissões e produtos.</p></div>
      <div className="flex flex-wrap gap-2 text-sm"><Link href="/admin/vendedores" className="rounded-lg border border-green-500/40 px-3 py-2 font-bold text-green-300">Vendedores</Link><Link href="/admin/comissoes" className="rounded-lg border border-amber-500/40 px-3 py-2 font-bold text-amber-300">Comissões</Link><Link href="/admin/pedidos" className="rounded-lg bg-blue-600 px-3 py-2 font-bold">Pedidos</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold">← Painel</Link></div>
    </div>

    <form method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div><label className="text-sm font-bold text-zinc-300">Período</label><input type="month" name="month" defaultValue={month} className="mt-2 block rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div><button className="rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Atualizar dashboard</button><strong className="ml-auto capitalize text-blue-300">{monthLabel}</strong></form>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Faturamento</p><p className="mt-2 text-2xl font-black text-green-400">{money.format(revenue)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Vendas concluídas</p><p className="mt-2 text-3xl font-black">{Number(summary?.sales_count || 0)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Ticket médio</p><p className="mt-2 text-2xl font-black text-blue-400">{money.format(Number(summary?.avg_ticket || 0))}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Comissão gerada</p><p className="mt-2 text-2xl font-black text-amber-400">{money.format(commissionGenerated)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Orçamentos em aberto</p><p className="mt-2 text-3xl font-black text-amber-300">{Number(summary?.open_quotes || 0)}</p></div>
    </section>

    <section className="mt-8 grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Origem das vendas</h2><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><span className="text-zinc-400">Por vendedores</span><strong>{money.format(sellerSales)}</strong></div><div className="flex justify-between gap-4"><span className="text-zinc-400">Venda direta</span><strong>{money.format(directSales)}</strong></div></div></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Comissões</h2><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><span className="text-zinc-400">Geradas</span><strong>{money.format(commissionGenerated)}</strong></div><div className="flex justify-between gap-4"><span className="text-zinc-400">Pagas</span><strong className="text-green-400">{money.format(paidCommissions)}</strong></div><div className="flex justify-between gap-4"><span className="text-zinc-400">Pendentes</span><strong className="text-amber-400">{money.format(Math.max(commissionGenerated - paidCommissions, 0))}</strong></div></div></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-black">Estoque atual</h2><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><span className="text-zinc-500">Produtos disponíveis</span><strong className="block text-xl text-green-400">{Number(stock?.products_available || 0)}</strong></div><div><span className="text-zinc-500">Estoque baixo</span><strong className="block text-xl text-amber-400">{Number(stock?.low_stock_products || 0)}</strong></div><div><span className="text-zinc-500">Sem estoque</span><strong className="block text-xl text-red-400">{Number(stock?.out_of_stock_products || 0)}</strong></div><div><span className="text-zinc-500">Unidades totais</span><strong className="block text-xl">{Number(stock?.total_units || 0)}</strong></div></div></div>
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Ranking de vendedores</h2><Link href={`/admin/comissoes?month=${month}`} className="text-sm font-bold text-blue-400">Ver comissões</Link></div>{sellerRanking.length===0 ? <p className="mt-5 text-zinc-400">Nenhuma venda concluída no período.</p> : <div className="mt-5 divide-y divide-zinc-800">{sellerRanking.map((seller:any,index:number)=><div key={`${String(seller.seller_id || 'direta')}-${index}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-4"><span className="text-lg font-black text-zinc-500">{index+1}º</span><div><strong>{String(seller.seller_name)}</strong><p className="mt-1 text-xs text-zinc-500">{Number(seller.sales_count)} venda(s){seller.seller_id ? ` • comissão ${money.format(Number(seller.commission_total || 0))}` : ""}</p></div><strong className="text-blue-400">{money.format(Number(seller.sales_total))}</strong></div>)}</div>}</div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-black">Produtos mais vendidos</h2>{topProducts.length===0 ? <p className="mt-5 text-zinc-400">Nenhum produto vendido no período.</p> : <div className="mt-5 divide-y divide-zinc-800">{topProducts.map((product:any,index:number)=><div key={`${String(product.product_id)}-${index}`} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 py-4"><span className="text-lg font-black text-zinc-500">{index+1}º</span><div><strong>{String(product.product_name)}</strong><p className="mt-1 text-xs text-zinc-500">{Number(product.units_sold)} unidade(s) vendida(s)</p></div><strong className="text-green-400">{money.format(Number(product.sales_total))}</strong></div>)}</div>}</div>
    </section>
  </main>;
}
