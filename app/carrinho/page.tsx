"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const checkout = async () => {
    if (!items.length || sending) return;
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível registrar o orçamento.");
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o orçamento.");
    } finally {
      setSending(false);
    }
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
        <div className="mt-5">
          <label className="text-sm font-bold text-zinc-300">Seu nome (opcional)</label>
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} maxLength={120} placeholder="Como podemos te chamar?" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Antes de abrir o WhatsApp, o orçamento será registrado para facilitar o atendimento. O valor final, disponibilidade e garantia serão confirmados pela Vitória Informática. Atendimento local em Goiânia - GO.</p>
        {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p> : null}
        <button onClick={checkout} disabled={sending} className="mt-6 w-full rounded-xl bg-green-600 px-5 py-4 font-black hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-zinc-700">{sending ? "Registrando orçamento..." : "Enviar orçamento pelo WhatsApp"}</button>
      </aside>
    </main>
  );
}
