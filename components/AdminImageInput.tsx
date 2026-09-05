"use client";

import { useEffect, useState } from "react";

export default function AdminImageInput() {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-bold text-zinc-300">Foto principal</label>
      <input
        name="imageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          if (preview) URL.revokeObjectURL(preview);
          const file = event.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
        className="mt-2 block w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
      />
      <p className="mt-2 text-xs text-zinc-500">JPG, PNG ou WebP. Máximo de 8 MB.</p>
      {preview ? (
        <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <img src={preview} alt="Prévia da foto do produto" className="h-full w-full object-contain p-4" />
        </div>
      ) : null}
    </div>
  );
}
