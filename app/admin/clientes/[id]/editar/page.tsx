import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatabase } from "@netlify/database";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata = { title: "Editar cliente", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const db = getDatabase();
  const rows = await db.sql`
    SELECT c.id, c.name, c.phone, c.email, c.document, c.city, c.notes,
           COUNT(o.id)::int AS orders_count,
           COALESCE(SUM(o.total), 0) AS quoted_total
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    WHERE c.id = ${id}
    GROUP BY c.id
    LIMIT 1
  `;
  if (!rows.length) notFound();
  const customer = rows[0] as any;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0"><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática • Clientes</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Editar cliente</h1></div>
        <Link href="/admin/clientes" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold hover:bg-zinc-800">← Clientes</Link>
      </div>
      {saved === "1" ? <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 font-bold text-green-300">Cliente atualizado com sucesso.</div> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Orçamentos</p><p className="mt-2 text-3xl font-black">{Number(customer.orders_count)}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><p className="text-sm text-zinc-400">Total orçado</p><p className="mt-2 text-3xl font-black text-blue-400">{money.format(Number(customer.quoted_total || 0))}</p></div>
      </div>
      <form action={`/api/admin/customers/${encodeURIComponent(id)}`} method="post" className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:grid-cols-2">
        <div><label className="text-sm font-bold text-zinc-300">Nome</label><input required name="name" defaultValue={String(customer.name)} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold text-zinc-300">Telefone / WhatsApp</label><input name="phone" inputMode="tel" defaultValue={customer.phone ? String(customer.phone) : ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold text-zinc-300">E-mail</label><input name="email" type="email" defaultValue={customer.email ? String(customer.email) : ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div><label className="text-sm font-bold text-zinc-300">CPF/CNPJ</label><input name="document" defaultValue={customer.document ? String(customer.document) : ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">Cidade</label><input name="city" defaultValue={customer.city ? String(customer.city) : ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">Observações</label><textarea name="notes" rows={5} defaultValue={customer.notes ? String(customer.notes) : ""} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        <button className="rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500 md:col-span-2">Salvar alterações</button>
      </form>
    </main>
  );
}
