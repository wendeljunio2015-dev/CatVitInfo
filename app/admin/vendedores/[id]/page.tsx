import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Painel do Vendedor", robots: { index: false, follow: false } };

export default async function SellerPanelPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const db = getDatabase();
  const sellers = await db.sql`SELECT id,name,slug,phone,commission_rate,active FROM sellers WHERE id=${id} LIMIT 1`;
  if (!sellers.length) notFound();
  const seller:any = sellers[0];
  const orders = await db.sql`
    SELECT id,order_number,customer_name,total,status,commission_amount,created_at,stock_deducted_at
    FROM orders WHERE seller_id=${id} ORDER BY created_at DESC LIMIT 100
  `;
  const completed = orders.filter((o:any)=>String(o.status)==="concluido");
  const open = orders.filter((o:any)=>["novo","em_atendimento"].includes(String(o.status)));
  const salesTotal = completed.reduce((sum:number,o:any)=>sum+Number(o.total||0),0);
  const commissionTotal = completed.reduce((sum:number,o:any)=>sum+Number(o.commission_amount||0),0);
  const paidRows = await db.sql`SELECT COALESCE(SUM(paid_amount),0) AS paid FROM commission_settlements WHERE seller_id=${id}`;
  const paid = Number(paidRows[0]?.paid||0);
  const money = new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
  const date = new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Sao_Paulo"});
  const statusLabel:Record<string,string>={novo:"Novo",em_atendimento:"Em atendimento",concluido:"Concluído",cancelado:"Cancelado"};

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-green-400">Painel individual</p><h1 className="mt-2 text-3xl font-black">{String(seller.name)}</h1><p className="mt-2 text-zinc-400">{seller.active?"Vendedor ativo":"Vendedor inativo"} • Comissão {Number(seller.commission_rate).toFixed(2).replace(".",",")}%</p><p className="mt-2 break-all text-sm text-blue-300">https://catvitinfo.netlify.app/v/{String(seller.slug)}</p></div><Link href="/admin/vendedores" className="rounded-xl border border-zinc-700 px-4 py-3 font-bold">← Vendedores</Link></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Orçamentos</p><p className="mt-2 text-3xl font-black">{orders.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Em aberto</p><p className="mt-2 text-3xl font-black text-amber-400">{open.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Vendas</p><p className="mt-2 text-3xl font-black text-green-400">{completed.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Total vendido</p><p className="mt-2 text-xl font-black text-blue-400">{money.format(salesTotal)}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-500">Comissão pendente</p><p className="mt-2 text-xl font-black text-emerald-400">{money.format(Math.max(0,commissionTotal-paid))}</p><p className="mt-1 text-xs text-zinc-500">Pago: {money.format(paid)}</p></div></div>
    <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 px-5 py-4"><h2 className="text-xl font-black">Atendimentos atribuídos</h2></div>{orders.length===0?<p className="p-6 text-zinc-500">Nenhum atendimento atribuído ainda.</p>:<div className="divide-y divide-zinc-800">{orders.map((o:any)=><div key={String(o.id)} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-black">{String(o.order_number)}</p><p className="mt-1 text-sm text-zinc-400">{o.customer_name?String(o.customer_name):"Cliente não identificado"} • {date.format(new Date(String(o.created_at)))}</p></div><div><span className="text-xs font-bold text-zinc-400">{statusLabel[String(o.status)]||String(o.status)}</span>{o.commission_amount!=null?<p className="mt-1 text-sm font-bold text-green-400">Comissão {money.format(Number(o.commission_amount))}</p>:null}</div><strong className="text-blue-400">{money.format(Number(o.total||0))}</strong></div>)}</div>}</section>
  </main>;
}
