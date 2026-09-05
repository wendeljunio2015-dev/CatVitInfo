import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Comissões", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function validMonth(value?: string) {
  return value && /^\d{4}-\d{2}$/.test(value) && Number(value.slice(5, 7)) >= 1 && Number(value.slice(5, 7)) <= 12;
}

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<{ month?: string; paid?: string; error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const month = validMonth(params.month) ? String(params.month) : new Date().toISOString().slice(0, 7);
  const periodMonth = `${month}-01`;
  const db = getDatabase();

  const sellers = await db.sql`
    WITH sales AS (
      SELECT seller_id,
             COUNT(*)::int AS sales_count,
             COALESCE(SUM(total),0)::numeric AS sales_total,
             COALESCE(SUM(commission_amount),0)::numeric AS commission_total
      FROM orders
      WHERE status='concluido'
        AND seller_id IS NOT NULL
        AND stock_deducted_at >= ${periodMonth}::date
        AND stock_deducted_at < (${periodMonth}::date + INTERVAL '1 month')
      GROUP BY seller_id
    ), payments AS (
      SELECT seller_id,
             COALESCE(SUM(paid_amount),0)::numeric AS paid_total,
             MAX(paid_at) AS last_paid_at
      FROM commission_settlements
      WHERE period_month=${periodMonth}::date
      GROUP BY seller_id
    )
    SELECT s.id,s.name,s.active,
           COALESCE(sa.sales_count,0)::int AS sales_count,
           COALESCE(sa.sales_total,0)::numeric AS sales_total,
           COALESCE(sa.commission_total,0)::numeric AS commission_total,
           COALESCE(p.paid_total,0)::numeric AS paid_total,
           GREATEST(COALESCE(sa.commission_total,0)-COALESCE(p.paid_total,0),0)::numeric AS pending_total,
           p.last_paid_at
    FROM sellers s
    LEFT JOIN sales sa ON sa.seller_id=s.id
    LEFT JOIN payments p ON p.seller_id=s.id
    ORDER BY s.active DESC, s.name ASC
  `;

  const history = await db.sql`
    SELECT cs.id,cs.paid_amount,cs.paid_at,cs.period_month,s.name AS seller_name
    FROM commission_settlements cs
    JOIN sellers s ON s.id=cs.seller_id
    WHERE cs.period_month=${periodMonth}::date
    ORDER BY cs.paid_at DESC
  `;

  const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month:"long", year:"numeric", timeZone:"UTC" }).format(new Date(`${periodMonth}T12:00:00Z`));
  const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short", timeZone:"America/Sao_Paulo" });
  const totalSales = sellers.reduce((sum:number, row:any) => sum + Number(row.sales_total || 0), 0);
  const totalCommission = sellers.reduce((sum:number, row:any) => sum + Number(row.commission_total || 0), 0);
  const totalPaid = sellers.reduce((sum:number, row:any) => sum + Number(row.paid_total || 0), 0);
  const totalPending = sellers.reduce((sum:number, row:any) => sum + Number(row.pending_total || 0), 0);

  const errorMessage = params.error === "empty" ? "Não há comissão pendente para esse vendedor no período." : params.error === "seller" ? "Vendedor não encontrado." : params.error ? "Não foi possível registrar o pagamento." : "";

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Comissões</h1><p className="mt-3 text-zinc-400">Fechamento de vendas e pagamentos por vendedor.</p></div>
      <div className="flex flex-wrap gap-2 text-sm"><Link href="/admin/vendedores" className="rounded-lg bg-blue-600 px-3 py-2 font-bold hover:bg-blue-500">Vendedores</Link><Link href="/admin/pedidos" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold hover:bg-zinc-800">Pedidos</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold hover:bg-zinc-800">← Painel</Link></div>
    </div>

    <form method="get" className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div><label className="text-sm font-bold text-zinc-300">Mês do fechamento</label><input type="month" name="month" defaultValue={month} className="mt-2 block rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div><button className="rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500">Consultar</button><strong className="ml-auto capitalize text-blue-300">{monthLabel}</strong></form>

    {params.paid ? <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-bold text-green-300">Pagamento de comissão registrado com sucesso.</div> : null}
    {errorMessage ? <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">{errorMessage}</div> : null}

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Vendas concluídas</p><p className="mt-2 text-2xl font-black text-blue-400">{money.format(totalSales)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Comissão gerada</p><p className="mt-2 text-2xl font-black">{money.format(totalCommission)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Comissão paga</p><p className="mt-2 text-2xl font-black text-green-400">{money.format(totalPaid)}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Saldo pendente</p><p className="mt-2 text-2xl font-black text-amber-400">{money.format(totalPending)}</p></div>
    </div>

    <section className="mt-8 space-y-4">
      {sellers.map((seller:any) => {
        const pending = Number(seller.pending_total || 0);
        return <article key={String(seller.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-5"><div><h2 className="text-xl font-black">{String(seller.name)}</h2><p className="mt-1 text-sm text-zinc-400">{Number(seller.sales_count)} venda(s) concluída(s) no período</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${pending > 0 ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-green-500/20 bg-green-500/10 text-green-300"}`}>{pending > 0 ? "Pendente" : "Em dia"}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4"><div><span className="text-xs text-zinc-500">Vendido</span><strong className="block">{money.format(Number(seller.sales_total))}</strong></div><div><span className="text-xs text-zinc-500">Comissão</span><strong className="block">{money.format(Number(seller.commission_total))}</strong></div><div><span className="text-xs text-zinc-500">Pago</span><strong className="block text-green-400">{money.format(Number(seller.paid_total))}</strong></div><div><span className="text-xs text-zinc-500">Saldo</span><strong className="block text-amber-400">{money.format(pending)}</strong></div></div>
          {pending > 0 ? <form action="/api/admin/commissions/settle" method="post" className="mt-5"><input type="hidden" name="sellerId" value={String(seller.id)}/><input type="hidden" name="month" value={month}/><button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-black hover:bg-green-500">Registrar pagamento de {money.format(pending)}</button><p className="mt-2 text-xs text-zinc-500">Registra somente o saldo pendente atual. Novas vendas no mesmo mês gerarão um novo saldo.</p></form> : null}
        </article>;
      })}
    </section>

    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-xl font-black">Pagamentos registrados no período</h2>{history.length===0 ? <p className="mt-4 text-zinc-400">Nenhum pagamento de comissão registrado neste mês.</p> : <div className="mt-5 divide-y divide-zinc-800">{history.map((item:any)=><div key={String(item.id)} className="flex flex-wrap justify-between gap-3 py-4 text-sm"><div><strong>{String(item.seller_name)}</strong><p className="mt-1 text-zinc-500">{dateTime.format(new Date(String(item.paid_at)))}</p></div><strong className="text-green-400">{money.format(Number(item.paid_amount))}</strong></div>)}</div>}</section>
  </main>;
}
