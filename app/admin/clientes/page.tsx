import Link from "next/link";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Clientes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const { created } = await searchParams;
  const db = getDatabase();
  const customers = await db.sql`
    SELECT c.id, c.name, c.phone, c.email, c.document, c.city, c.notes, c.created_at,
           COUNT(o.id)::int AS orders_count,
           COALESCE(SUM(o.total), 0) AS quoted_total
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT 200
  `;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p>
          <h1 className="mt-2 text-4xl font-black">Clientes</h1>
          <p className="mt-3 text-zinc-400">Cadastre contatos e acompanhe o histórico de orçamentos.</p>
        </div>
        <Link href="/admin" className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">← Voltar ao painel</Link>
      </div>

      {created === "1" ? <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-300">Cliente cadastrado com sucesso.</div> : null}

      <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-black">Cadastrar cliente</h2>
        <form action="/api/admin/customers" method="post" className="mt-6 grid gap-4 md:grid-cols-2">
          <input required name="name" placeholder="Nome completo" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <input name="phone" inputMode="tel" placeholder="Telefone / WhatsApp" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <input name="email" type="email" placeholder="E-mail (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <input name="document" placeholder="CPF/CNPJ (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <input name="city" placeholder="Cidade" defaultValue="Goiânia - GO" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
          <textarea name="notes" rows={3} placeholder="Observações (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
          <button className="rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500 md:col-span-2">Cadastrar cliente</button>
        </form>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5"><h2 className="text-xl font-black">Clientes cadastrados</h2></div>
        {customers.length === 0 ? <p className="p-6 text-zinc-400">Nenhum cliente cadastrado ainda.</p> : (
          <div className="divide-y divide-zinc-800">
            {customers.map((customer: any) => (
              <div key={String(customer.id)} className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-lg font-black">{String(customer.name)}</p>
                  <p className="mt-1 text-sm text-zinc-400">{customer.phone ? `📱 ${String(customer.phone)}` : "Sem telefone"}{customer.email ? ` • ${String(customer.email)}` : ""}</p>
                  <p className="mt-2 text-sm text-zinc-500">{Number(customer.orders_count)} orçamento(s) • {money.format(Number(customer.quoted_total || 0))} orçado</p>
                </div>
                <Link href={`/admin/clientes/${encodeURIComponent(String(customer.id))}/editar`} className="rounded-xl border border-blue-500/30 px-4 py-2 text-center text-sm font-bold text-blue-300">Editar cliente</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
