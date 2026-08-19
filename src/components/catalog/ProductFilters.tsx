"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/domain";

export type SortOption = "recent" | "name-asc" | "price-asc" | "price-desc";

interface ProductFiltersProps {
  categories: Category[];
  activeCategory: string | "all";
  onCategoryChange: (slug: string | "all") => void;
  search: string;
  onSearchChange: (value: string) => void;
  onlyAvailable: boolean;
  onOnlyAvailableChange: (value: boolean) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "name-asc", label: "Nome A-Z" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
];

export function ProductFilters({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  onlyAvailable,
  onOnlyAvailableChange,
  sort,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink/40"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar uma raça..."
          aria-label="Buscar uma raça"
          className="w-full rounded-full border border-brand-sand bg-white py-3 pl-11 pr-4 text-sm text-brand-ink outline-none transition-colors focus:border-brand-green focus:ring-1 focus:ring-brand-green"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "border-brand-green bg-brand-green text-brand-cream"
              : "border-brand-sand bg-white text-brand-ink/70 hover:border-brand-green/50",
          )}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.slug)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === category.slug
                ? "border-brand-green bg-brand-green text-brand-cream"
                : "border-brand-sand bg-white text-brand-ink/70 hover:border-brand-green/50",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-brand-ink/80">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => onOnlyAvailableChange(e.target.checked)}
            className="h-4 w-4 rounded border-brand-sand text-brand-green focus:ring-brand-green"
          />
          Mostrar somente disponíveis
        </label>

        <label className="flex items-center gap-2 text-sm text-brand-ink/80">
          <span className="sr-only">Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-full border border-brand-sand bg-white px-4 py-2 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
