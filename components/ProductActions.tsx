"use client";

import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/product";

export default function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const unavailable = product.stockStatus === "indisponivel";
  const message = encodeURIComponent(`Olá! Tenho interesse em: ${product.name} - R$ ${product.price.toFixed(2).replace(".", ",")}`);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        disabled={unavailable}
        onClick={() => addItem(product)}
        className="rounded-xl bg-blue-600 px-5 py-3 font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
      >
        {unavailable ? "Indisponível" : "Adicionar ao carrinho"}
      </button>
      <a
        href={`https://wa.me/5562994780830?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-bold hover:bg-zinc-800"
      >
        Consultar no WhatsApp
      </a>
    </div>
  );
}
