import { getAllCategoriesAdmin, getAllProductsAdmin } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/(admin)/admin/(protected)/produtos/actions";

export const metadata = { title: "Adicionar Novo Item" };

export default async function NovoProdutoPage() {
  const [categories, products] = await Promise.all([
    getAllCategoriesAdmin(),
    getAllProductsAdmin(),
  ]);

  // Nomes de raças já cadastradas (sem repetir), pra oferecer no seletor do
  // formulário em vez de deixar digitar tudo do zero toda vez — útil
  // principalmente quando a mesma raça vai ser cadastrada como Ovo e como
  // Ave separadamente.
  const existingNames = Array.from(new Set(products.map((p) => p.name))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  // Categoria e preço já usados por cada raça (a última vez que apareceu no
  // catálogo) — o ProductForm usa isso pra preencher sozinho esses dois
  // campos assim que uma raça já cadastrada é escolhida acima.
  const racaDefaults: Record<string, { categoryId: string | null; price: number | null }> = {};
  for (const p of products) {
    if (!(p.name in racaDefaults)) {
      racaDefaults[p.name] = { categoryId: p.categoryId, price: p.price };
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Adicionar Novo Item</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Depois de salvar, você poderá enviar as fotos na tela de edição.
      </p>

      <div className="mt-6">
        <ProductForm
          categories={categories}
          existingNames={existingNames}
          racaDefaults={racaDefaults}
          action={createProduct}
          submitLabel="Cadastrar raça"
        />
      </div>
    </div>
  );
}
