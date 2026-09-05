import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Pedidos e Orçamentos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = { novo: "Novo", em_atendimento: "Em atendimento", concluido: "Concluído", cancelado: "Cancelado" };
const statusClass: Record<string, string> = {
  novo: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  em_atendimento: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  concluido: "text-green-300 bg-green-500/10 border-green-500/20",
  cancelado: "text-red-300 bg-red-500/10 border-red-500/20",
};

export default async function OrdersPage() {
  await requireAdmin();
  const db = getDatabase();
  const orders = await db.sql`
    SELECT id, order_number, customer_id, customer_name, items, total, status, created_at
    FROM orders ORDER BY created_at DESC LIMIT 100
  `;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const openCount = orders.filter((order: any) => ["novo", "em_atendimento"].includes(String(order.status))).length;
  const completedCount = orders.filter((order: any) => String(order.status) === "concluido").length;
  const totalQuoted = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0"><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Pedidos e orçamentos</h1><p className="mt-3 text-zinc-400">Acompanhe os orçamentos enviados pelo catálogo para o WhatsApp.</p></div>
        <div className="flex flex-wrap items-center gap-2 text-sm"><Link href="/admin/clientes" className="rounded-lg bg-blue-600 px-3 py-2 font-bold hover:bg-blue-500">Clientes</Link><Link href="/admin" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold hover:bg-zinc-800">← Painel</Link></div>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Aguardando atendimento</p><p className="mt-2 text-4xl font-black text-amber-400">{openCount}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Concluídos</p><p className="mt-2 text-4xl font-black text-green-400">{completedCount}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Valor orçado</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(totalQuoted)}</p></div>
      </div>
      <section className="mt-10 space-y-4">
        {orders.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-400">Nenhum orçamento registrado ainda.</div> : orders.map((order: any) => {
          const items = Array.isArray(order.items) ? order.items : [];
          return <article key={String(order.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-black">{String(order.order_number)}</h2><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass[String(order.status)] || "border-zinc-700 text-zinc-300"}`}>{statusLabel[String(order.status)] || String(order.status)}</span></div><p className="mt-2 text-sm text-zinc-400">{order.customer_name ? <>Cliente: {order.customer_id ? <Link href={`/admin/clientes/${encodeURIComponent(String(order.customer_id))}/editar`} className="font-bold text-blue-300 hover:underline">{String(order.customer_name)}</Link> : String(order.customer_name)} • </> : null}{date.format(new Date(String(order.created_at)))}</p></div><strong className="text-2xl text-blue-400">{money.format(Number(order.total))}</strong></div>
            <div className="mt-5 space-y-2 rounded-xl bg-zinc-950 p-4">{items.map((item: any, index: number) => <div key={`${String(item.productId)}-${index}`} className="flex justify-between gap-4 text-sm"><span>{Number(item.quantity)}x {String(item.name)}</span><span className="font-bold">{money.format(Number(item.subtotal))}</span></div>)}</div>
            <form action={`/api/admin/orders/${encodeURIComponent(String(order.id))}`} method="post" className="mt-5 flex flex-wrap gap-2"><select name="status" defaultValue={String(order.status)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm font-bold"><option value="novo">Novo</option><option value="em_atendimento">Em atendimento</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option></select><button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-black hover:bg-blue-500">Atualizar status</button></form>
          </article>;
        })}
      </section>
    </main>
  );
}
