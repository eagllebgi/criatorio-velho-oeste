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
  const existingNames = Array.from(
    new Set(products.filter((p) => p.id !== id).map((p) => p.name)),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

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
          action={boundUpdate}
          submitLabel="Salvar alterações"
        />
      </div>
    </div>
  );
}
