"use client";

import { useEffect, useState } from "react";

export default function AdminImageInput({ maxFiles = 5 }: { maxFiles?: number }) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-bold text-zinc-300">Fotos do produto</label>
      <input
        name="imageFiles"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          previews.forEach((url) => URL.revokeObjectURL(url));
          const files = Array.from(event.target.files ?? []).slice(0, maxFiles);
          if ((event.target.files?.length ?? 0) > maxFiles) {
            alert(`Selecione no máximo ${maxFiles} fotos por produto.`);
            event.target.value = "";
            setPreviews([]);
            return;
          }
          setPreviews(files.map((file) => URL.createObjectURL(file)));
        }}
        className="mt-2 block w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
      />
      <p className="mt-2 text-xs text-zinc-500">Até {maxFiles} fotos. JPG, PNG ou WebP. Máximo de 8 MB por foto. A primeira será a foto principal.</p>
      {previews.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {previews.map((preview, index) => (
            <div key={preview} className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              <img src={preview} alt={`Prévia ${index + 1}`} className="h-full w-full object-contain p-2" />
              {index === 0 ? <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black">Principal</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
