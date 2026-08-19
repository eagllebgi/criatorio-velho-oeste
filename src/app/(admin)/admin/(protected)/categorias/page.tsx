import { getAllCategoriesAdmin } from "@/lib/data/admin";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categorias" };

export default async function CategoriasPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Categorias</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Gerencie as categorias usadas para filtrar o catálogo.
      </p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
