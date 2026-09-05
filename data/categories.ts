export const productCategories = [
  "Computadores",
  "Processadores",
  "Kits Upgrade",
  "Placas-mãe",
  "SSDs",
  "Memórias RAM",
  "Placas de Vídeo",
  "Fontes",
  "Periféricos",
  "Gabinetes",
  "Coolers",
] as const;

export type ProductCategory = (typeof productCategories)[number];
