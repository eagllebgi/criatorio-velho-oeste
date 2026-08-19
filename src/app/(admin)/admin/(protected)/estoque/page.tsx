import { getAllProductsAdmin } from "@/lib/data/admin";
import { StockManager } from "@/components/admin/StockManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Estoque</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Atualize rapidamente a quantidade disponível de cada raça.
      </p>
      <div className="mt-6">
        <StockManager products={products} />
      </div>
    </div>
  );
}
