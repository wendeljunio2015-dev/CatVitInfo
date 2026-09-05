import Link from "next/link";
import { products } from "@/data/products";

export const metadata = {
  title: "Painel Administrativo",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const featured = products.filter((product) => product.featured).length;
  const promotions = products.filter((product) => product.badge === "Promoção").length;
  const available = products.filter((product) => product.stockStatus !== "indisponivel").length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Vitória Informática</p>
          <h1 className="mt-2 text-4xl font-black">Painel administrativo</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">Base do gerenciamento do catálogo. A próxima conexão permitirá cadastrar, editar e remover produtos sem alterar o código.</p>
        </div>
        <Link href="/produtos" className="rounded-xl border border-zinc-700 px-5 py-3 font-bold hover:bg-zinc-900">Ver catálogo</Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Produtos</p><p className="mt-2 text-4xl font-black">{products.length}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Disponíveis</p><p className="mt-2 text-4xl font-black text-green-400">{available}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Destaques</p><p className="mt-2 text-4xl font-black text-blue-400">{featured}</p></div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><p className="text-sm text-zinc-400">Promoções</p><p className="mt-2 text-4xl font-black text-red-400">{promotions}</p></div>
      </div>

      <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-6 py-5"><h2 className="text-xl font-black">Produtos atuais</h2></div>
        <div className="divide-y divide-zinc-800">
          {products.map((product) => (
            <div key={product.id} className="grid gap-3 px-6 py-5 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div><p className="font-bold">{product.name}</p><p className="mt-1 text-sm text-zinc-500">{product.category}</p></div>
              <p className="font-black text-blue-400">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}</p>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-center text-xs font-bold text-zinc-300">{product.stockStatus === "em_estoque" ? "Em estoque" : product.stockStatus === "ultimas_unidades" ? "Últimas unidades" : "Indisponível"}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-6">
        <p className="font-black text-amber-300">Área administrativa em preparação</p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">O banco de dados do catálogo já está sendo preparado. Antes de liberar edição de produtos, o painel receberá autenticação para impedir alterações por visitantes.</p>
      </div>
    </main>
  );
}
