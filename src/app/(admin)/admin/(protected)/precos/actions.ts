"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PriceUpdate {
  id: string;
  price: number | null;
}

export interface PriceActionState {
  error: string | null;
  success: boolean;
}

export async function bulkUpdatePrice(
  updates: PriceUpdate[],
): Promise<PriceActionState> {
  if (updates.length === 0) return { error: null, success: true };

  const supabase = await createClient();

  const results = await Promise.all(
    updates.map(({ id, price }) =>
      supabase
        .from("products")
        .update({ price: price !== null && price >= 0 ? price : null })
        .eq("id", id),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message, success: false };

  revalidatePath("/admin/precos");
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");

  return { error: null, success: true };
}
