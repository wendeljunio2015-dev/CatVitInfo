"use client";

import { useMemo, useState } from "react";

export default function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const cleanImages = useMemo(() => images.filter(Boolean).slice(0, 5), [images]);
  const [selected, setSelected] = useState(0);
  const mainImage = cleanImages[selected] ?? cleanImages[0];

  if (!cleanImages.length) {
    return (
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
        <div className="text-center">
          <div className="text-8xl">🖥️</div>
          <p className="mt-4 text-sm text-zinc-500">Imagem do produto será adicionada em breve</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
        <img src={mainImage} alt={name} className="h-full w-full object-contain p-6" />
      </div>
      {cleanImages.length > 1 ? (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {cleanImages.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelected(index)}
              className={`aspect-square overflow-hidden rounded-xl border bg-zinc-950 p-1 ${selected === index ? "border-blue-500" : "border-zinc-800 hover:border-zinc-600"}`}
              aria-label={`Ver foto ${index + 1} de ${name}`}
            >
              <img src={image} alt={`${name} - foto ${index + 1}`} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
