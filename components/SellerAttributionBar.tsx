"use client";

import { useEffect, useState } from "react";

type SellerState = { attributed: boolean; seller?: { id: string; name: string } };

export default function SellerAttributionBar() {
  const [state, setState] = useState<SellerState | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/seller/current", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: SellerState) => { if (active) setState(data); })
      .catch(() => { if (active) setState({ attributed: false }); });
    return () => { active = false; };
  }, []);
  if (!state?.attributed || !state.seller?.name) return null;
  return <div className="border-b border-green-500/20 bg-green-500/10 px-4 py-2 text-center text-xs font-bold text-green-300 sm:text-sm">👤 Atendimento com <span className="text-white">{state.seller.name}</span></div>;
}
