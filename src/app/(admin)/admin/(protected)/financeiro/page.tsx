import { getAllProductsAdmin, getFinanceiroMesAdmin } from "@/lib/data/admin";
import { FinanceiroManager } from "@/components/admin/FinanceiroManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const [entries, products] = await Promise.all([getFinanceiroMesAdmin(), getAllProductsAdmin()]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Financeiro</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Registre entradas e saídas do dia a dia e acompanhe o caixa do mês.
      </p>
      <div className="mt-6">
        <FinanceiroManager entries={entries} products={products} />
      </div>
    </div>
  );
}
