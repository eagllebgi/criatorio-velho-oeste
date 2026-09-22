"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types/domain";
import { ProductFilters, type SortOption } from "@/components/catalog/ProductFilters";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";

export function CatalogClient({
  products,
  categories,
  isAdmin = false,
}: {
  products: Product[];
  categories: Category[];
  isAdmin?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    let result = products;

    if (activeCategory !== "all") {
      result = result.filter((p) => p.categorySlug === activeCategory);
    }

    if (onlyAvailable) {
      result = result.filter((p) => p.stock > 0);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Critério de ordenação escolhido pela pessoa (nome, preço, etc.).
    function compareBySort(a: Product, b: Product): number {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name, "pt-BR");
        case "price-asc":
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case "price-desc":
          return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        case "recent":
        default:
          return a.displayOrder - b.displayOrder;
      }
    }

    // Indisponíveis sempre vão pro final da lista, independente do critério
    // de ordenação escolhido — dentro de cada grupo (disponível/indisponível)
    // o critério normal continua valendo.
    const sorted = [...result].sort((a, b) => {
      const aOut = a.stock <= 0 ? 1 : 0;
      const bOut = b.stock <= 0 ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;
      return compareBySort(a, b);
    });

    return sorted;
  }, [products, activeCategory, onlyAvailable, search, sort]);

  return (
    <div className="space-y-8">
      <ProductFilters
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        search={search}
        onSearchChange={setSearch}
        onlyAvailable={onlyAvailable}
        onOnlyAvailableChange={setOnlyAvailable}
        sort={sort}
        onSortChange={setSort}
      />
      <ProductGrid products={filtered} isAdmin={isAdmin} />
      <FloatingCartButton />
    </div>
  );
}
