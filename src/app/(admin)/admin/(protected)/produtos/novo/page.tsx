import { getAllCategoriesAdmin } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/(admin)/admin/(protected)/produtos/actions";

export const metadata = { title: "Adicionar nova raça" };

export default async function NovoProdutoPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Adicionar nova raça</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Depois de salvar, você poderá enviar as fotos na tela de edição.
      </p>

      <div className="mt-6">
        <ProductForm categories={categories} action={createProduct} submitLabel="Cadastrar raça" />
      </div>
    </div>
  );
}
