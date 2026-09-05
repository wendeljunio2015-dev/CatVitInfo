import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "@/components/ProductActions";
import { getCatalogProductBySlug } from "@/lib/catalog-db";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const stockLabel = {
  em_estoque: "Em estoque",
  ultimas_unidades: "Últimas unidades",
  indisponivel: "Indisponível",
};

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <Link href="/produtos" className="text-sm font-semibold text-blue-400 hover:text-blue-300">← Voltar ao catálogo</Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-contain p-6" />
          ) : (
            <div className="text-center">
              <div className="text-8xl">🖥️</div>
              <p className="mt-4 text-sm text-zinc-500">Imagem do produto será adicionada em breve</p>
            </div>
          )}
        </div>

        <section>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{product.category}</span>
            {product.badge && <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-bold text-blue-400">{product.badge}</span>}
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-300">{product.description}</p>
          <p className="mt-7 text-4xl font-black text-blue-500">{money.format(product.price)}</p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm">
            <p><span className="font-bold text-white">Disponibilidade:</span> <span className="text-zinc-300">{stockLabel[product.stockStatus]}</span></p>
            <p><span className="font-bold text-white">Garantia:</span> <span className="text-zinc-300">{product.warranty ?? "Consulte"}</span></p>
            <p><span className="font-bold text-white">Atendimento:</span> <span className="text-zinc-300">Goiânia - GO</span></p>
          </div>

          {product.specs?.length ? (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Especificações</h2>
              <ul className="mt-4 space-y-3 text-zinc-300">
                {product.specs.map((spec) => <li key={spec} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">{spec}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="mt-8"><ProductActions product={product} /></div>
        </section>
      </div>
    </main>
  );
}
