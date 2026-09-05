import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/catalog-db";
import AdminDeleteButton from "@/components/AdminDeleteButton";

export const metadata = { title: "Painel Administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  let products = [] as Awaited<ReturnType<typeof getCatalogProducts>>;
  let databaseReady = true;
  try { products = await getCatalogProducts(); } catch { databaseReady = false; }

  const featured = products.filter((p) => p.featured).length;
  const promotions = products.filter((p) => p.badge === "Promoção").length;
  const available = products.filter((p) => p.stockStatus !== "indisponivel").length;
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return <main className="mx-auto max-w-7xl px-6 py-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p><h1 className="mt-2 text-4xl font-black">Painel administrativo</h1><p className="mt-3 text-zinc-400">Cadastre e gerencie os produtos do catálogo.</p></div><div className="flex gap-2"><Link href="/produtos" className="rounded-xl border border-zinc-700 px-5 py-3 font-bold">Ver catálogo</Link><form action="/api/admin/logout" method="post"><button className="rounded-xl border border-red-500/30 px-5 py-3 font-bold text-red-300">Sair</button></form></div></div>

    {!databaseReady && <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">O banco de dados ainda está sendo provisionado pelo Netlify. Aguarde a conclusão do deploy.</div>}

    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Produtos</p><p className="mt-2 text-4xl font-black">{products.length}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Disponíveis</p><p className="mt-2 text-4xl font-black text-green-400">{available}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Destaques</p><p className="mt-2 text-4xl font-black text-blue-400">{featured}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Promoções</p><p className="mt-2 text-4xl font-black text-red-400">{promotions}</p></div></div>

    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="text-2xl font-black">Cadastrar produto</h2><form action="/api/admin/products" method="post" className="mt-6 grid gap-4 md:grid-cols-2"><input required name="name" placeholder="Nome do produto" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><input required name="category" placeholder="Categoria" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><input required name="price" type="number" min="0" step="0.01" placeholder="Preço" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><input name="warranty" placeholder="Garantia (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"/><select name="stockStatus" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="em_estoque">Em estoque</option><option value="ultimas_unidades">Últimas unidades</option><option value="indisponivel">Indisponível</option></select><select name="badge" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="">Sem selo</option><option>Novo</option><option>Promoção</option><option>Destaque</option></select><input name="image" placeholder="URL da imagem (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2"/><textarea name="description" placeholder="Descrição" rows={4} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2"/><label className="flex items-center gap-3"><input type="checkbox" name="featured"/> Mostrar como destaque</label><button disabled={!databaseReady} className="rounded-xl bg-blue-600 px-5 py-3 font-black hover:bg-blue-500 disabled:bg-zinc-700">Cadastrar produto</button></form></section>

    <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"><div className="border-b border-zinc-800 px-6 py-5"><h2 className="text-xl font-black">Produtos no banco</h2></div>{products.length === 0 ? <p className="p-6 text-zinc-400">Nenhum produto cadastrado no banco ainda.</p> : <div className="divide-y divide-zinc-800">{products.map((p) => <div key={p.id} className="grid gap-3 px-6 py-5 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-bold">{p.name}</p><p className="text-sm text-zinc-500">{p.category}</p></div><p className="font-black text-blue-400">{money.format(p.price)}</p><AdminDeleteButton id={p.id} name={p.name}/></div>)}</div>}</section>
  </main>;
}
