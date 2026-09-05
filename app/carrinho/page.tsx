"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const whatsappNumber = "5562994780830";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  const checkout = () => {
    if (!items.length) return;
    const lines = [
      "Olá! Gostaria de solicitar um orçamento na Vitória Informática:",
      "",
      ...items.map((item) => `• ${item.quantity}x ${item.product.name} — ${money.format(item.product.price * item.quantity)}`),
      "",
      `Total estimado: ${money.format(total)}`,
      "",
      "Por favor, confirme disponibilidade, garantia e condições de retirada/entrega em Goiânia.",
    ];
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  if (!items.length) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-black">Seu carrinho está vazio</h1>
        <p className="mt-4 text-zinc-400">Adicione produtos para montar seu orçamento.</p>
        <Link href="/produtos" className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Orçamento</p>
          <h1 className="mt-2 text-4xl font-black">Carrinho</h1>
        </div>
        <button onClick={clearCart} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-800">Limpar carrinho</button>
      </div>

      <div className="space-y-4">
        {items.map(({ product, quantity }) => (
          <article key={product.id} className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-lg font-bold">{product.name}</h2>
              <p className="mt-1 text-zinc-400">{money.format(product.price)} cada</p>
              <p className="mt-2 font-bold text-blue-400">Subtotal: {money.format(product.price * quantity)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800">−</button>
              <span className="min-w-10 text-center font-bold">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800">+</button>
              <button onClick={() => removeItem(product.id)} className="ml-2 rounded-lg border border-red-900 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950">Remover</button>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Total estimado</span>
          <strong className="text-3xl text-blue-500">{money.format(total)}</strong>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-400">O valor final, disponibilidade e garantia serão confirmados pela Vitória Informática. Atendimento local em Goiânia - GO.</p>
        <button onClick={checkout} className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-black hover:bg-green-500">Enviar orçamento pelo WhatsApp</button>
      </aside>
    </main>
  );
}
