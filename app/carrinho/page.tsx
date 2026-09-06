"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import MercadoPagoCheckout from "@/components/MercadoPagoCheckout";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const mercadoPagoPublicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

type PaymentOrder = { id: string; orderNumber: string; total: number };

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);

  const createOrder = async (channel: "whatsapp" | "mercado_pago") => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        customerName,
        customerPhone,
        customerEmail,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível registrar o pedido.");
    return result;
  };

  const checkoutWhatsApp = async () => {
    if (!items.length || sending) return;
    setSending(true);
    setError("");
    try {
      const result = await createOrder("whatsapp");
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o orçamento.");
    } finally {
      setSending(false);
    }
  };

  const checkoutMercadoPago = async () => {
    if (!items.length || sending || paymentOrder) return;
    setSending(true);
    setError("");
    try {
      const result = await createOrder("mercado_pago");
      setPaymentOrder({ id: result.id, orderNumber: result.orderNumber, total: Number(result.total) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setSending(false);
    }
  };

  if (!items.length) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-black">Seu carrinho está vazio</h1>
        <p className="mt-4 text-zinc-400">Adicione produtos para montar seu pedido.</p>
        <Link href="/produtos" className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-500">Ver produtos</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-widest text-blue-400">Compra segura</p><h1 className="mt-2 text-4xl font-black">Carrinho</h1></div>
        <button onClick={clearCart} disabled={Boolean(paymentOrder)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">Limpar carrinho</button>
      </div>
      <div className="space-y-4">{items.map(({ product, quantity }) => {
        const stock = Math.max(0, Number(product.stockQuantity ?? 0));
        const atLimit = quantity >= stock;
        const locked = Boolean(paymentOrder);
        return <article key={product.id} className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-lg font-bold">{product.name}</h2><p className="mt-1 text-zinc-400">{money.format(product.price)} cada</p><p className="mt-1 text-sm text-zinc-500">Estoque disponível: {stock} un.</p><p className="mt-2 font-bold text-blue-400">Subtotal: {money.format(product.price * quantity)}</p></div><div className="flex flex-wrap items-center gap-2"><button disabled={locked} onClick={() => updateQuantity(product.id, quantity - 1)} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">−</button><span className="min-w-10 text-center font-bold">{quantity}</span><button disabled={atLimit || locked} onClick={() => updateQuantity(product.id, quantity + 1)} title={atLimit ? "Limite do estoque atingido" : "Adicionar uma unidade"} className="h-10 w-10 rounded-lg border border-zinc-700 font-bold hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">+</button><button disabled={locked} onClick={() => removeItem(product.id)} className="ml-2 rounded-lg border border-red-900 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40">Remover</button>{atLimit ? <span className="w-full text-right text-xs font-bold text-amber-400">Quantidade máxima disponível</span> : null}</div></article>;
      })}</div>
      <aside className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-4"><span className="text-zinc-400">Total</span><strong className="text-3xl text-blue-500">{money.format(total)}</strong></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-bold text-zinc-300">Seu nome</label><input disabled={Boolean(paymentOrder)} value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={120} placeholder="Nome do cliente" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 disabled:opacity-60" /></div>
          <div><label className="text-sm font-bold text-zinc-300">WhatsApp</label><input disabled={Boolean(paymentOrder)} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} inputMode="tel" placeholder="(62) 99999-9999" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 disabled:opacity-60" /></div>
          <div className="md:col-span-2"><label className="text-sm font-bold text-zinc-300">E-mail</label><input disabled={Boolean(paymentOrder)} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" placeholder="cliente@email.com" className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 disabled:opacity-60" /></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Para pagar online, informe nome, WhatsApp e e-mail. O estoque e o valor são validados novamente no servidor antes de criar o pedido.</p>
        {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p> : null}

        {!paymentOrder ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button onClick={checkoutMercadoPago} disabled={sending || !mercadoPagoPublicKey} className="rounded-xl bg-blue-600 px-5 py-4 font-black hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700">{sending ? "Preparando..." : "Pagar com Mercado Pago"}</button>
            <button onClick={checkoutWhatsApp} disabled={sending} className="rounded-xl bg-green-600 px-5 py-4 font-black hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-zinc-700">Enviar orçamento pelo WhatsApp</button>
          </div>
        ) : (
          <div className="mt-6">
            <MercadoPagoCheckout orderId={paymentOrder.id} orderNumber={paymentOrder.orderNumber} amount={paymentOrder.total} customerEmail={customerEmail} publicKey={mercadoPagoPublicKey} onApproved={() => undefined} />
          </div>
        )}

        <div className="mt-6 grid gap-3 text-xs text-zinc-400 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><strong className="block text-zinc-200">Pix</strong>QR Code e copia e cola pelo Mercado Pago.</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><strong className="block text-zinc-200">3DS 2.0</strong>O banco pode solicitar autenticação adicional no cartão.</div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><strong className="block text-zinc-200">Proteção ao Vendedor</strong>Aplicável conforme as regras e elegibilidade do Mercado Pago.</div>
        </div>
      </aside>
    </main>
  );
}
