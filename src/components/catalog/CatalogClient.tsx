"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types/domain";
import { ProductFilters, type SortOption } from "@/components/catalog/ProductFilters";
import { ProductGrid } from "@/components/catalog/ProductGrid";

export function CatalogClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
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

    const sorted = [...result];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        break;
      case "price-asc":
        sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        break;
      case "price-desc":
        sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
        break;
      case "recent":
      default:
        sorted.sort((a, b) => a.displayOrder - b.displayOrder);
    }

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
      <ProductGrid products={filtered} />
    </div>
  );
}
