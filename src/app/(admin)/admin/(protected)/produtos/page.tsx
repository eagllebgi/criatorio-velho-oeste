import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProductsAdmin } from "@/lib/data/admin";
import { AdminProductTable } from "@/components/admin/AdminProductTable";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-brand-ink">Produtos</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Gerencie as raças cadastradas no catálogo.
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar Novo Item
        </Link>
      </div>

      <div className="mt-6">
        <AdminProductTable products={products} />
      </div>
    </div>
  );
}
