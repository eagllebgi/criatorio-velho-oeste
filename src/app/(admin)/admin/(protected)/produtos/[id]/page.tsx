import { notFound } from "next/navigation";
import { getAllCategoriesAdmin, getAllProductsAdmin, getProductByIdAdmin } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import { updateProduct } from "@/app/(admin)/admin/(protected)/produtos/actions";

export const metadata = { title: "Editar raça" };

export default async function EditarProdutoPage(
  props: PageProps<"/admin/produtos/[id]">,
) {
  const { id } = await props.params;
  const [product, categories, products] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategoriesAdmin(),
    getAllProductsAdmin(),
  ]);

  if (!product) notFound();

  // Nomes de outras raças já cadastradas (exclui a própria, senão ela
  // apareceria duplicada — uma vez como opção selecionável e outra como
  // valor atual já preenchido).
  const outrasRacas = products.filter((p) => p.id !== id);
  const existingNames = Array.from(new Set(outrasRacas.map((p) => p.name))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  // O ProductForm exige essa prop, mas o preenchimento automático só roda
  // no CADASTRO de item novo (quando não existe um "product" — ver
  // ProductForm.tsx), então aqui em edição o conteúdo nem chega a ser usado.
  const racaDefaults: Record<string, { categoryId: string | null; price: number | null }> = {};
  for (const p of outrasRacas) {
    if (!(p.name in racaDefaults)) {
      racaDefaults[p.name] = { categoryId: p.categoryId, price: p.price };
    }
  }

  const supabase = await createClient();
  const { data: imageRows } = await supabase
    .from("product_images")
    .select("id, image_url")
    .eq("product_id", id)
    .order("display_order", { ascending: true });

  const boundUpdate = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">
        Editar {product.name}
      </h1>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-ink/50">
          Fotos
        </h2>
        <ProductImageManager
          productId={id}
          mainImage={product.mainImage}
          initialImages={(imageRows ?? []).map((r) => ({ id: r.id, url: r.image_url }))}
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-ink/50">
          Dados da raça
        </h2>
        <ProductForm
          product={product}
          categories={categories}
          existingNames={existingNames}
          racaDefaults={racaDefaults}
          action={boundUpdate}
          submitLabel="Salvar alterações"
        />
      </div>
    </div>
  );
}
