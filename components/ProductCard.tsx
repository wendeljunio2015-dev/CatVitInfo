"use client";

import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/product";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const stockLabel = {
  em_estoque: "Em estoque",
  ultimas_unidades: "Últimas unidades",
  indisponivel: "Indisponível",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const unavailable = product.stockStatus === "indisponivel";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-5 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-950">
        {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <span className="text-5xl">🖥️</span>}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{product.category}</span>
          {product.badge && <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-bold text-blue-400">{product.badge}</span>}
        </div>
        <h3 className="mt-4 text-xl font-bold">{product.name}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{product.description}</p>
        <div className="mt-auto pt-5">
          <p className="text-3xl font-black text-blue-500">{money.format(product.price)}</p>
          <p className="mt-2 text-sm text-zinc-400">{product.warranty ? `Garantia: ${product.warranty}` : "Consulte a garantia"}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-300">{stockLabel[product.stockStatus]}</p>
          <button disabled={unavailable} onClick={() => addItem(product)} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 hover:bg-blue-500">{unavailable ? "Indisponível" : "Adicionar ao carrinho"}</button>
        </div>
      </div>
    </article>
  );
}
