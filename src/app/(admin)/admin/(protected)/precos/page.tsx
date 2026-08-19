import { getAllProductsAdmin } from "@/lib/data/admin";
import { PriceManager } from "@/components/admin/PriceManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preços" };

export default async function PrecosPage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Preços</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Atualize rapidamente o preço por ovo de cada raça.
      </p>
      <div className="mt-6">
        <PriceManager products={products} />
      </div>
    </div>
  );
}
