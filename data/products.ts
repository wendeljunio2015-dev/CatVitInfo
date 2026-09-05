import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "i5-10600k",
    name: "Intel Core i5-10600K",
    slug: "intel-core-i5-10600k",
    category: "Processadores",
    price: 799,
    description: "Processador Intel Core i5-10600K para plataforma LGA1200.",
    specs: ["6 núcleos / 12 threads", "Frequência de até 4,8 GHz", "Socket LGA1200"],
    warranty: "3 meses",
    stockStatus: "em_estoque",
    featured: true,
    badge: "Destaque",
  },
  {
    id: "kit-ryzen-5500-b450",
    name: "Kit Ryzen 5 5500 + B450 Husky NEXUS",
    slug: "kit-ryzen-5-5500-b450-husky-nexus",
    category: "Kits Upgrade",
    price: 950,
    description: "Kit upgrade com Ryzen 5 5500 e placa-mãe B450 Husky NEXUS.",
    stockStatus: "em_estoque",
    featured: true,
  },
  {
    id: "kit-b75-i7-2700k",
    name: "Kit B75 BlueCase + Intel Core i7-2700K",
    slug: "kit-b75-bluecase-i7-2700k",
    category: "Kits Upgrade",
    price: 370,
    description: "Kit com placa-mãe B75 BlueCase e processador Intel Core i7-2700K.",
    stockStatus: "em_estoque",
    featured: true,
  },
];

export const categories = [
  "Todos",
  "Processadores",
  "Kits Upgrade",
  "Placas-mãe",
  "SSDs",
  "Memórias RAM",
  "Placas de Vídeo",
  "Fontes",
  "Periféricos",
];
