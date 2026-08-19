import type { Product } from "@/lib/types/domain";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="container-site py-20">
      <div className="mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Destaques
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
            Raças em destaque
          </h2>
        </div>
        <Button href="/ovos" variant="outline">
          Ver todos os ovos
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
