"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const submitQuote = async () => {
    if (!items.length || sending) return;
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
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

  const handleClearCart = () => {
    if (window.confirm("Deseja realmente remover todos os produtos do carrinho?")) clearCart();
  };

  if (!items.length) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-black">Seu carrinho está vazio</h1>
        <p className="mt-4 text-zinc-400">Adicione produtos para montar seu pedido ou solicitar um orçamento.</p>
        <Link href="/produtos" className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">Seu pedido</p>
          <h1 className="mt-2 text-4xl font-black">Carrinho <span className="text-xl font-bold text-zinc-500">• {itemCount} {itemCount === 1 ? "item" : "itens"}</span></h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/produtos" className="rounded-xl border border-blue-500/30 px-4 py-2 text-sm font-bold text-blue-300 hover:bg-blue-500/10">Continuar comprando</Link>
          <button onClick={handleClearCart} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-800">Limpar carrinho</button>
        </div>
      </div>
      <div className="space-y-4">{items.map(({ product, quantity }) => {
        const stock = Math.max(0, Number(product.stockQuantity ?? 0));
        const atLimit = quantity >= stock;
        return <article key={product.id} className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><div className="flex min-w-0 gap-4"><Link href={`/produto/${product.slug}`} aria-label={`Ver ${product.name}`} className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 sm:h-28 sm:w-28">{product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" /> : <span className="text-3xl" aria-hidden="true">🖥️</span>}</Link><div className="min-w-0"><Link href={`/produto/${product.slug}`} className="text-lg font-bold hover:text-blue-400">{product.name}</Link><p className="mt-1 text-zinc-400">{money.format(product.price)} cada</p><p className="mt-1 text-sm text-zinc-500">Estoque disponível: {stock} un.</p><p className="mt-2 font-bold text-blue-400">Subtotal: {money.format(product.price * quantity)}</p></div></div><div className="flex flex-wrap items-center gap-2 sm:justify-end"><button onClick={() => updateQuantity(product.id, quantity - 1)} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800">−</button><span className="min-w-10 text-center font-bold">{quantity}</span><button disabled={atLimit} onClick={() => updateQuantity(product.id, quantity + 1)} title={atLimit ? "Limite do estoque atingido" : "Adicionar uma unidade"} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">+</button><button onClick={() => removeItem(product.id)} className="ml-2 rounded-lg border border-red-900 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950">Remover</button>{atLimit ? <span className="w-full text-left text-xs font-bold text-amber-400 sm:text-right">Quantidade máxima disponível</span> : null}</div></article>;
      })}</div>
      <aside className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-4"><span className="text-zinc-400">Total estimado</span><strong className="text-3xl text-blue-500">{money.format(total)}</strong></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-bold text-zinc-300">Seu nome</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={120} placeholder="Nome do cliente" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div><label className="text-sm font-bold text-zinc-300">WhatsApp</label><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" placeholder="(62) 99999-9999" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
          <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">E-mail (opcional)</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" placeholder="cliente@email.com" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" /></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Ao escolher <strong className="text-zinc-300">Somente orçamento</strong>, nome e WhatsApp serão vinculados ao atendimento. O estoque será validado novamente antes de registrar o orçamento.</p>
        {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p> : null}
        <div className="mt-6">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Como deseja continuar?</p>
          <div className="mt-3 grid gap-3">
            <button type="button" disabled className="cursor-not-allowed rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 text-left opacity-70">
              <span className="flex items-center justify-between gap-3"><span className="font-black text-white">Pagar pelo Mercado Pago</span><span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-blue-300">Em breve</span></span>
              <span className="mt-1 block text-sm leading-6 text-zinc-400">Pix ou cartão. Checkout online em preparação.</span>
            </button>
            <button type="button" onClick={submitQuote} disabled={sending} className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-left hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              <span className="block font-black text-white">{sending ? "Registrando orçamento..." : "Somente orçamento"}</span>
              <span className="mt-1 block text-sm leading-6 text-zinc-300">Enviar o carrinho pelo WhatsApp para confirmar disponibilidade, condições e orçamento final.</span>
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
