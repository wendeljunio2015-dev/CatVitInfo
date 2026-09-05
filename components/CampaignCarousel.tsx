"use client";

import { useEffect, useState } from "react";

type Campaign = { id:string; title:string; message?:string|null; buttonLabel?:string|null; buttonUrl?:string|null; imageUrl?:string|null; theme:string };

const themes: Record<string,string> = {
  blue: "from-blue-950 via-zinc-950 to-blue-900 border-blue-500/30",
  red: "from-red-950 via-zinc-950 to-red-900 border-red-500/30",
  green: "from-green-950 via-zinc-950 to-emerald-900 border-green-500/30",
  amber: "from-amber-950 via-zinc-950 to-yellow-900 border-amber-500/30",
};

export default function CampaignCarousel({ campaigns }: { campaigns: Campaign[] }) {
  const [index,setIndex] = useState(0);
  const [paused,setPaused] = useState(false);
  useEffect(() => {
    if (campaigns.length < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % campaigns.length), 5000);
    return () => window.clearInterval(timer);
  }, [campaigns.length, paused]);
  if (!campaigns.length) return null;
  const campaign = campaigns[index] ?? campaigns[0];
  const move = (step:number) => setIndex((current) => (current + step + campaigns.length) % campaigns.length);
  return <section aria-label="Campanhas da Vitória Informática" className="border-b border-zinc-800 bg-zinc-950" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
    <div className={`relative overflow-hidden border-y bg-gradient-to-r ${themes[campaign.theme] || themes.blue}`}>
      {campaign.imageUrl && <img src={campaign.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20"/>}
      <div className="relative mx-auto flex min-h-44 max-w-7xl items-center justify-between gap-6 px-12 py-8 sm:px-16">
        <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-white/60">Campanha ativa</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{campaign.title}</h2>{campaign.message && <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-200 sm:text-base">{campaign.message}</p>}{campaign.buttonLabel && campaign.buttonUrl && <a href={campaign.buttonUrl} className="mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-zinc-950 hover:bg-zinc-200">{campaign.buttonLabel}</a>}</div>
        {campaigns.length > 1 && <><button type="button" onClick={()=>move(-1)} aria-label="Banner anterior" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-xl hover:bg-black/70">‹</button><button type="button" onClick={()=>move(1)} aria-label="Próximo banner" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-xl hover:bg-black/70">›</button></>}
      </div>
      {campaigns.length > 1 && <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{campaigns.map((item,i)=><button key={item.id} type="button" onClick={()=>setIndex(i)} aria-label={`Ir para banner ${i+1}`} className={`h-2 rounded-full transition-all ${i===index ? "w-7 bg-white" : "w-2 bg-white/40"}`}/>)}</div>}
    </div>
  </section>;
}
