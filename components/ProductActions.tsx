"use client";

import { useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types/product";

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.3-1.5A9.9 9.9 0 1 0 12 2Zm0 17.9c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.9.9-3-.2-.3A7.9 7.9 0 1 1 12 19.9Zm4.3-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.4-1.3-3.3-2.9-.2-.3.2-.3.7-1.1.1-.2.1-.4 0-.6 0-.2-.6-1.5-.9-2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  );
}

export default function ProductActions({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unavailable = product.stockStatus === "indisponivel";
  const message = encodeURIComponent(`Olá! Tenho interesse em: ${product.name} - R$ ${product.price.toFixed(2).replace(".", ",")}`);
  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        disabled={unavailable}
        onClick={handleAdd}
        aria-live="polite"
        className={`rounded-xl px-5 py-3 font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 ${added ? "scale-[1.02] bg-emerald-600 text-white shadow-lg shadow-emerald-950/30" : "bg-blue-600 text-white hover:bg-blue-500"}`}
      >
        {unavailable ? "Indisponível" : added ? "✓ Adicionado ao carrinho" : "Adicionar ao carrinho"}
      </button>
      <a
        href={`/whatsapp?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-green-700/50 px-5 py-3 text-center font-bold text-green-300 hover:bg-green-950/30"
      >
        <WhatsAppIcon /> Consultar no WhatsApp
      </a>
    </div>
  );
}
