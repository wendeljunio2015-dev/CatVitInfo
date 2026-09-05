"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDeleteButton({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!window.confirm(`Excluir ${name}?`)) return;
    setLoading(true);
    const response = await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setLoading(false);
    if (response.ok) router.refresh(); else window.alert("Não foi possível excluir o produto.");
  }

  return <button type="button" disabled={loading} onClick={remove} className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50">{loading ? "Excluindo..." : "Excluir"}</button>;
}
