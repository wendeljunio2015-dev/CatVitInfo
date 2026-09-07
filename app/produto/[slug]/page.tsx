import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "@/components/ProductActions";
import ProductGallery from "@/components/ProductGallery";
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

  const images = product.images ?? (product.image ? [product.image] : []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 md:py-16">
      <Link href="/produtos" className="text-sm font-semibold text-blue-400 hover:text-blue-300">← Voltar ao catálogo</Link>

      <div className="mt-6 grid min-w-0 gap-8 sm:mt-8 sm:gap-10 lg:grid-cols-2">
        <div className="min-w-0"><ProductGallery name={product.name} images={images} /></div>

        <section className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{product.category}</span>
            {product.badge && <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-bold text-blue-400">{product.badge}</span>}
          </div>

          <h1 className="mt-5 break-words text-[18px] font-extrabold leading-[1.25] sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">{product.name}</h1>
          <p className="mt-4 break-words text-base leading-7 text-zinc-300 sm:mt-5 sm:text-lg sm:leading-8">{product.description}</p>
          <p className="mt-6 break-words text-3xl font-black text-blue-500 sm:mt-7 sm:text-4xl">{money.format(product.price)}</p>

          <div className="mt-6 grid min-w-0 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm sm:p-5">
            <p className="break-words"><span className="font-bold text-white">Disponibilidade:</span> <span className="text-zinc-300">{stockLabel[product.stockStatus]}</span></p>
            <p className="break-words"><span className="font-bold text-white">Garantia:</span> <span className="text-zinc-300">{product.warranty ?? "Consulte"}</span></p>
            <p className="break-words"><span className="font-bold text-white">Atendimento:</span> <span className="text-zinc-300">Goiânia - GO</span></p>
          </div>

          {product.specs?.length ? (
            <div className="mt-8 min-w-0">
              <h2 className="text-xl font-bold">Especificações</h2>
              <ul className="mt-4 min-w-0 space-y-3 text-zinc-300">
                {product.specs.map((spec) => <li key={spec} className="min-w-0 break-words rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">{spec}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 min-w-0"><ProductActions product={product} /></div>
        </section>
      </div>
    </main>
  );
}
