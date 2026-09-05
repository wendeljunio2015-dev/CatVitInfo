import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Vendedores", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SellersPage() {
  await requireAdmin();
  const db = getDatabase();
  const sellers = await db.sql`
    SELECT s.id,s.name,s.slug,s.phone,s.commission_rate,s.active,s.created_at,
      COUNT(o.id)::int AS orders_count,
      COUNT(o.id) FILTER (WHERE o.status='concluido')::int AS sales_count,
      COALESCE(SUM(o.total) FILTER (WHERE o.status='concluido'),0) AS sales_total,
      COALESCE(SUM(o.commission_amount) FILTER (WHERE o.status='concluido'),0) AS commission_total
    FROM sellers s
    LEFT JOIN orders o ON o.seller_id=s.id
    GROUP BY s.id
    ORDER BY s.active DESC, s.name ASC
  `;
  const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Vendedores</h1><p className="mt-3 text-zinc-400">Links individuais, vendas e comissão.</p></div><div className="flex gap-2 text-sm"><Link href="/admin/pedidos" className="rounded-lg bg-blue-600 px-3 py-2 font-bold">Pedidos</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold">← Painel</Link></div></div>

    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-2xl font-black">Cadastrar vendedor</h2><form action="/api/admin/sellers" method="post" className="mt-6 grid gap-4 md:grid-cols-3"><input required name="name" placeholder="Nome do vendedor" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><input required name="phone" inputMode="tel" placeholder="WhatsApp com DDD" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><div><label className="text-xs font-bold text-zinc-400">Comissão (%)</label><input required name="commissionRate" type="number" min="0" max="100" step="0.01" defaultValue="5" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/></div><button className="rounded-xl bg-blue-600 px-5 py-3 font-black md:col-span-3">Cadastrar vendedor</button></form></section>

    <section className="mt-10 space-y-4">{sellers.length===0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">Nenhum vendedor cadastrado.</div> : sellers.map((seller:any)=><article key={String(seller.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black">{String(seller.name)}</h2><p className="mt-1 text-sm text-zinc-400">{seller.active ? "Ativo" : "Inativo"} • Comissão {Number(seller.commission_rate).toFixed(2).replace(".",",")}%</p><p className="mt-2 break-all text-sm text-blue-300">https://catvitinfo.netlify.app/v/{String(seller.slug)}</p></div><div className="grid grid-cols-2 gap-3 text-right text-sm"><div><span className="text-zinc-500">Vendas</span><strong className="block text-lg">{Number(seller.sales_count)}</strong></div><div><span className="text-zinc-500">Comissão</span><strong className="block text-lg text-green-400">{money.format(Number(seller.commission_total))}</strong></div><div><span className="text-zinc-500">Total vendido</span><strong className="block">{money.format(Number(seller.sales_total))}</strong></div><div><span className="text-zinc-500">Orçamentos</span><strong className="block">{Number(seller.orders_count)}</strong></div></div></div><form action={`/api/admin/sellers/${encodeURIComponent(String(seller.id))}`} method="post" className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_160px_auto_auto]"><input required name="name" defaultValue={String(seller.name)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"/><input required name="phone" defaultValue={String(seller.phone)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"/><input required name="commissionRate" type="number" min="0" max="100" step="0.01" defaultValue={Number(seller.commission_rate)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"/><label className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold"><input type="checkbox" name="active" defaultChecked={Boolean(seller.active)}/> Ativo</label><button className="rounded-lg bg-blue-600 px-4 py-2 font-bold">Salvar</button></form></article>)}</section>
  </main>;
}
