export interface StockStatus {
  level: "available" | "low" | "out";
  label: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  stock: number;
  lowStockThreshold: number;
  mainImage: string | null;
  images: string[];
  active: boolean;
  featured: boolean;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

export function getStockStatus(product: {
  stock: number;
  lowStockThreshold: number;
}): StockStatus {
  if (product.stock <= 0) {
    return { level: "out", label: "Indisponível no momento" };
  }
  if (product.stock <= product.lowStockThreshold) {
    return { level: "low", label: "Últimas unidades" };
  }
  return { level: "available", label: "Disponível" };
}
