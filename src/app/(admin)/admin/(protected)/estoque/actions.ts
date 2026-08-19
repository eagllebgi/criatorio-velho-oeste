"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface StockUpdate {
  id: string;
  stock: number;
}

export interface StockActionState {
  error: string | null;
  success: boolean;
}

export async function bulkUpdateStock(
  updates: StockUpdate[],
): Promise<StockActionState> {
  if (updates.length === 0) return { error: null, success: true };

  const supabase = await createClient();

  const results = await Promise.all(
    updates.map(({ id, stock }) =>
      supabase.from("products").update({ stock: Math.max(0, stock) }).eq("id", id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message, success: false };

  revalidatePath("/admin/estoque");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin");
  revalidatePath("/ovos");

  return { error: null, success: true };
}
