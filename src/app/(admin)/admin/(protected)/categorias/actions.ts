"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface CategoryFormState {
  error: string | null;
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome da categoria." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name, slug: slugify(name), display_order: 0 });

  if (error) {
    return {
      error: error.code === "23505" ? "Já existe uma categoria com esse nome." : error.message,
    };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/ovos");
  return { error: null };
}

export async function toggleCategoryActive(categoryId: string, nextActive: boolean) {
  const supabase = await createClient();
  await supabase.from("categories").update({ active: nextActive }).eq("id", categoryId);
  revalidatePath("/admin/categorias");
  revalidatePath("/ovos");
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/admin/categorias");
  revalidatePath("/ovos");
}
