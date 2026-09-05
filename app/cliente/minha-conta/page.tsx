import { getDatabase } from "@netlify/database";
import { requireCustomer } from "@/lib/customer-auth";

export const metadata = { title: "Minha conta | Vitória Informática", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const statusLabel: Record<string,string> = { novo:"Novo", em_atendimento:"Em atendimento", concluido:"Concluído", cancelado:"Cancelado" };

export default async function MyAccountPage() {
  const customerId = await requireCustomer();
  const db = getDatabase();
  const customers = await db.sql`SELECT id,name,email,phone,document,city,created_at,last_login_at FROM customers WHERE id=${customerId} LIMIT 1`;
  if (!customers.length) return null;
  const customer: any = customers[0];
  const orders = await db.sql`SELECT id,order_number,items,total,status,created_at FROM orders WHERE customer_id=${customerId} ORDER BY created_at DESC LIMIT 100`;
  const money = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short", timeZone:"America/Sao_Paulo" });
  const completed = orders.filter((order:any) => String(order.status) === "concluido");
  const completedTotal = completed.reduce((sum:number, order:any) => sum + Number(order.total || 0), 0);

  return <main className="mx-auto max-w-6xl px-6 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Área do cliente</p><h1 className="mt-2 text-4xl font-black">Olá, {String(customer.name)}</h1><p className="mt-3 text-zinc-400">Acompanhe seu histórico com a Vitória Informática.</p></div>
      <form action="/api/customer/logout" method="post"><button className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">Sair</button></form>
    </div>

    <div className="mt-10 grid gap-5 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Pedidos / orçamentos</p><p className="mt-2 text-4xl font-black">{orders.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Compras concluídas</p><p className="mt-2 text-4xl font-black text-green-400">{completed.length}</p></div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Total concluído</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(completedTotal)}</p></div>
    </div>

    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-2xl font-black">Meus dados</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 text-sm"><p><span className="text-zinc-500">E-mail:</span><br/><strong>{String(customer.email || "—")}</strong></p><p><span className="text-zinc-500">WhatsApp:</span><br/><strong>{String(customer.phone || "—")}</strong></p><p><span className="text-zinc-500">Cidade:</span><br/><strong>{String(customer.city || "—")}</strong></p><p><span className="text-zinc-500">CPF/CNPJ:</span><br/><strong>{String(customer.document || "—")}</strong></p></div></section>

    <section className="mt-10"><h2 className="text-2xl font-black">Histórico de compras e orçamentos</h2><div className="mt-5 space-y-4">{orders.length === 0 ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-400">Você ainda não possui pedidos ou orçamentos vinculados à sua conta.</div> : orders.map((order:any) => { const items = Array.isArray(order.items) ? order.items : []; return <article key={String(order.id)} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-black">{String(order.order_number)}</h3><p className="mt-1 text-sm text-zinc-400">{date.format(new Date(String(order.created_at)))} • {statusLabel[String(order.status)] || String(order.status)}</p></div><strong className="text-xl text-blue-400">{money.format(Number(order.total))}</strong></div><div className="mt-4 space-y-2 rounded-xl bg-zinc-950 p-4">{items.map((item:any,index:number) => <div key={index} className="flex justify-between gap-4 text-sm"><span>{Number(item.quantity)}x {String(item.name)}</span><span>{money.format(Number(item.subtotal))}</span></div>)}</div></article>; })}</div></section>
  </main>;
}
