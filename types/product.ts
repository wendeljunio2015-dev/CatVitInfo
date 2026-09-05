export type StockStatus = "em_estoque" | "ultimas_unidades" | "indisponivel";

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  specs?: string[];
  warranty?: string;
  stockStatus: StockStatus;
  featured?: boolean;
  badge?: "Novo" | "Promoção" | "Destaque";
  image?: string;
}
