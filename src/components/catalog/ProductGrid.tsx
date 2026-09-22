import type { Product } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";
import { EmptyState } from "@/components/catalog/EmptyState";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Nenhuma raça encontrada"
        description="Tente ajustar os filtros ou a busca. Novos ovos estarão disponíveis em breve."
        showWhatsApp
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
