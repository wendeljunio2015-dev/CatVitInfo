import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Lucro e Margem", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function validMonth(value?: string) {
  return value && /^\d{4}-\d{2}$/.test(value) && Number(value.slice(5, 7)) >= 1 && Number(value.slice(5, 7)) <= 12;
}

export default async function ProfitPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const month = validMonth(params.month) ? String(params.month) : new Date().toISOString().slice(0, 7);
  const periodMonth = `${month}-01`;
  const db = getDatabase();

  const rows = await db.sql`
    SELECT o.id,o.order_number,o.seller_name,o.total,o.commission_amount,o.stock_deducted_at,o.items
    FROM orders o
    WHERE o.status='concluido'
      AND o.stock_deducted_at >= ${periodMonth}::date
      AND o.stock_deducted_at < (${periodMonth}::date + INTERVAL '1 month')
    ORDER BY o.stock_deducted_at DESC
  `;

  let revenue = 0;
  let knownCost = 0;
  let coveredRevenue = 0;
  let commissions = 0;
  let missingCostItems = 0;

  const sales = rows.map((order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    let saleKnownCost = 0;
    let saleCoveredRevenue = 0;
    let saleMissing = 0;
    for (const item of items) {
      const subtotal = Number(item.subtotal || 0);
      if (item.costSubtotal == null) saleMissing += 1;
      else {
        saleKnownCost += Number(item.costSubtotal || 0);
        saleCoveredRevenue += subtotal;
      }
    }
    const total = Number(order.total || 0);
    const commission = Number(order.commission_amount || 0);
    revenue += total;
    knownCost += saleKnownCost;
    coveredRevenue += saleCoveredRevenue;
    commissions += commission;
    missingCostItems += saleMissing;
    const coveredGrossProfit = saleCoveredRevenue - saleKnownCost;
    const netAfterCommission = coveredGrossProfit - commission;
    return { ...order, saleKnownCost, saleCoveredRevenue, saleMissing, coveredGrossProfit, netAfterCommission };
  });

  const grossProfit = coveredRevenue - knownCost;
  const netProfitAfterCommission = grossProfit - commissions;
  const margin = coveredRevenue > 0 ? (grossProfit / coveredRevenue) * 100 : 0;
  const coverage = revenue > 0 ? (coveredRevenue / revenue) * 100 : 0;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${periodMonth}T12:00:00Z`));
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Lucro e margem</h1><p className="mt-3 text-zinc-400">Resultado baseado no custo registrado no momento de cada venda.</p></div><div className="flex flex-wrap gap-2 text-sm"><Link href="/admin/dashboard" className="rounded-lg bg-violet-600 px-3 py-2 font-bold">Dashboard</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold">← Painel</Link></div></div>

    <form method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div><label className="text-sm font-bold text-zinc-300">Período</label><input type="month" name="month" defaultValue={month} className="mt-2 block rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div><button className="rounded-xl bg-blue-600 px-5 py-3 font-black">Consultar</button><strong className="ml-auto capitalize text-blue-300">{monthLabel}</strong></form>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Faturamento</p><p className="mt-2 text-xl font-black text-green-400">{money.format(revenue)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Custo conhecido</p><p className="mt-2 text-xl font-black">{money.format(knownCost)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Lucro bruto</p><p className="mt-2 text-xl font-black text-blue-400">{money.format(grossProfit)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Margem bruta</p><p className="mt-2 text-xl font-black text-blue-300">{margin.toFixed(1).replace('.', ',')}%</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Comissões</p><p className="mt-2 text-xl font-black text-amber-400">{money.format(commissions)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Lucro após comissão</p><p className="mt-2 text-xl font-black text-violet-300">{money.format(netProfitAfterCommission)}</p></div>
    </section>

    <div className={`mt-6 rounded-2xl border p-4 text-sm ${coverage >= 99.9 ? 'border-green-500/20 bg-green-500/10 text-green-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-200'}`}><strong>Cobertura de custo: {coverage.toFixed(1).replace('.', ',')}%</strong>. {missingCostItems > 0 ? `${missingCostItems} item(ns) vendido(s) não possuem custo histórico registrado; por isso o lucro exibido é parcial e não inventa valores.` : 'Todos os itens vendidos no período possuem custo registrado.'}</div>

    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-black">Vendas do período</h2>{sales.length===0 ? <p className="mt-4 text-zinc-400">Nenhuma venda concluída neste período.</p> : <div className="mt-5 divide-y divide-zinc-800">{sales.map((sale:any)=><div key={String(sale.id)} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto_auto]"><div><strong>{String(sale.order_number)}</strong><p className="mt-1 text-xs text-zinc-500">{date.format(new Date(String(sale.stock_deducted_at)))} • {sale.seller_name ? `Vendedor: ${String(sale.seller_name)}` : 'Venda direta'}{sale.saleMissing ? ` • ${sale.saleMissing} item(ns) sem custo` : ''}</p></div><div className="text-sm"><span className="text-zinc-500">Venda</span><strong className="block">{money.format(Number(sale.total))}</strong></div><div className="text-sm"><span className="text-zinc-500">Custo conhecido</span><strong className="block">{money.format(Number(sale.saleKnownCost))}</strong></div><div className="text-sm"><span className="text-zinc-500">Após comissão</span><strong className="block text-violet-300">{money.format(Number(sale.netAfterCommission))}</strong></div></div>)}</div>}</section>
  </main>;
}
