"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { Category } from "@/lib/types/domain";
import { Badge } from "@/components/ui/Badge";
import {
  createCategory,
  deleteCategory,
  toggleCategoryActive,
  type CategoryFormState,
} from "@/app/(admin)/admin/(protected)/categorias/actions";

const initialState: CategoryFormState = { error: null };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="max-w-2xl space-y-6">
      <form action={formAction} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="name" className="block text-sm font-medium text-brand-ink">
            Nova categoria
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex: Marrecos"
            className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
        >
          {pending ? "Adicionando..." : "Adicionar"}
        </button>
      </form>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <ul className="divide-y divide-brand-sand/60 rounded-2xl border border-brand-sand/70 bg-white">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium text-brand-ink">{category.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => toggleCategoryActive(category.id, !category.active))
                }
              >
                <Badge tone={category.active ? "available" : "neutral"}>
                  {category.active ? "Ativa" : "Inativa"}
                </Badge>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`Excluir a categoria "${category.name}"?`)) {
                    startTransition(() => deleteCategory(category.id));
                  }
                }}
                aria-label={`Excluir ${category.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/50 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
