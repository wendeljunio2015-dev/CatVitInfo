import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getCatalogProducts } from "@/lib/catalog-db";
import { productCategories } from "@/data/categories";
import AdminDeleteButton from "@/components/AdminDeleteButton";
import AdminImageInput from "@/components/AdminImageInput";

export const metadata = { title: "Painel Administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  let products = [] as Awaited<ReturnType<typeof getCatalogProducts>>;
  let databaseReady = true;

  try {
    products = await getCatalogProducts();
  } catch {
    databaseReady = false;
  }

  const featured = products.filter((p) => p.featured).length;
  const promotions = products.filter((p) => p.badge === "Promoção").length;
  const available = products.filter((p) => (p.stockQuantity ?? 0) > 0).length;
  const totalUnits = products.reduce((sum, p) => sum + (p.stockQuantity ?? 0), 0);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const officialCategories = new Set<string>(productCategories);
  const legacyCategories = Array.from(
    new Set(products.map((product) => product.category).filter((category) => !officialCategories.has(category))),
  ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  const orderedCategories = [...productCategories, ...legacyCategories];
  const productGroups = orderedCategories
    .map((category) => ({
      category,
      products: products
        .filter((product) => product.category === category)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Painel administrativo</h1>
          <p className="mt-3 text-zinc-400">Cadastre e gerencie produtos, vendas e campanhas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/admin/dashboard" className="rounded-lg border border-violet-500/40 px-3 py-2 font-bold text-violet-300">Dashboard</Link>
          <Link href="/admin/campanhas" className="rounded-lg border border-pink-500/40 px-3 py-2 font-bold text-pink-300">Campanhas</Link>
          <Link href="/admin/lucro" className="rounded-lg border border-emerald-500/40 px-3 py-2 font-bold text-emerald-300">Lucro</Link>
          <Link href="/admin/clientes" className="rounded-lg border border-blue-500/40 px-3 py-2 font-bold text-blue-300">Clientes</Link>
          <Link href="/admin/vendedores" className="rounded-lg border border-green-500/40 px-3 py-2 font-bold text-green-300">Vendedores</Link>
          <Link href="/admin/comissoes" className="rounded-lg border border-amber-500/40 px-3 py-2 font-bold text-amber-300">Comissões</Link>
          <Link href="/admin/pedidos" className="rounded-lg bg-blue-600 px-3 py-2 font-bold">Pedidos</Link>
          <Link href="/produtos" className="rounded-lg border border-zinc-700 px-3 py-2 font-bold">Ver catálogo</Link>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-lg border border-red-500/30 px-3 py-2 font-bold text-red-300">Sair</button>
          </form>
        </div>
      </div>

      {!databaseReady && (
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">
          O banco de dados ainda está sendo provisionado pelo Netlify.
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Produtos</p><p className="mt-2 text-4xl font-black">{products.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Unidades</p><p className="mt-2 text-4xl font-black">{totalUnits}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Disponíveis</p><p className="mt-2 text-4xl font-black text-green-400">{available}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Destaques</p><p className="mt-2 text-4xl font-black text-blue-400">{featured}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Promoções</p><p className="mt-2 text-4xl font-black text-red-400">{promotions}</p></div>
      </div>

      <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-2xl font-black">Cadastrar produto</h2>
        <p className="mt-2 text-sm text-zinc-500">O preço de custo fica restrito ao administrativo e é usado para calcular lucro real.</p>
        <form action="/api/admin/products" method="post" encType="multipart/form-data" className="mt-6 grid gap-4 md:grid-cols-2">
          <input required name="name" placeholder="Nome do produto" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <select required name="category" defaultValue="" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3">
            <option value="" disabled>Selecione a categoria</option>
            {productCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <input required name="price" type="number" min="0" step="0.01" placeholder="Preço de venda" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <input name="costPrice" type="number" min="0" step="0.01" placeholder="Preço de custo (opcional)" className="rounded-xl border border-emerald-900/60 bg-zinc-950 px-4 py-3" />
          <input name="warranty" placeholder="Garantia (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
          <div><label className="text-sm font-bold text-zinc-300">Quantidade em estoque</label><input required name="stockQuantity" type="number" min="0" step="1" defaultValue={1} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <select name="badge" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"><option value="">Sem selo</option><option>Novo</option><option>Promoção</option><option>Destaque</option></select>
          <AdminImageInput />
          <input name="image" placeholder="Ou cole uma URL de imagem (opcional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
          <textarea name="description" placeholder="Descrição" rows={4} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 md:col-span-2" />
          <div className="md:col-span-2"><textarea name="specs" placeholder="Especificações técnicas — uma por linha" rows={6} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <label className="flex items-center gap-3"><input type="checkbox" name="featured" /> Mostrar como destaque</label>
          <button disabled={!databaseReady} className="rounded-xl bg-blue-600 px-5 py-3 font-black disabled:bg-zinc-700">Cadastrar produto</button>
        </form>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5">
          <h2 className="text-xl font-black">Produtos no banco</h2>
          {products.length > 0 && <p className="mt-1 text-sm text-zinc-500">Organizados por categoria e em ordem alfabética.</p>}
        </div>
        {products.length === 0 ? (
          <p className="p-6 text-zinc-400">Nenhum produto cadastrado no banco ainda.</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {productGroups.map((group) => (
              <section key={group.category} className="bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 px-6 py-3">
                  <h3 className="font-black text-blue-300">{group.category}</h3>
                  <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-zinc-400">
                    {group.products.length} {group.products.length === 1 ? "produto" : "produtos"}
                  </span>
                </div>
                <div className="divide-y divide-zinc-800">
                  {group.products.map((p) => (
                    <div key={p.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[72px_1fr_auto_auto] lg:items-center">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                        {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-contain p-1" /> : <span className="text-2xl">🖥️</span>}
                      </div>
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-sm text-zinc-500">{p.category} • {p.images?.length ?? 0} foto(s) • <strong className={(p.stockQuantity ?? 0) <= 2 ? "text-amber-400" : "text-green-400"}>{p.stockQuantity ?? 0} un.</strong></p>
                        <p className="mt-1 font-black text-blue-400">{money.format(p.price)}</p>
                      </div>
                      <Link href={`/admin/produtos/${encodeURIComponent(p.id)}/editar`} className="rounded-lg border border-blue-500/30 px-3 py-2 text-center text-sm font-bold text-blue-300">Editar</Link>
                      <AdminDeleteButton id={p.id} name={p.name} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
