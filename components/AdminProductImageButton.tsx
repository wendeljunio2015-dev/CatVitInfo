"use client";

import { useRef, useState } from "react";

export default function AdminProductImageButton({ id, name }: { id: string; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set("id", id);
      data.set("imageFile", file);
      const response = await fetch("/api/admin/products", { method: "PATCH", body: data });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        alert(result.error || "Não foi possível atualizar a foto.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border border-blue-500/30 px-4 py-2 text-sm font-bold text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
        title={`Trocar foto de ${name}`}
      >
        {busy ? "Enviando..." : "Trocar foto"}
      </button>
    </>
  );
}
