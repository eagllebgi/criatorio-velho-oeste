"use client";

import { useActionState, useState } from "react";
import type { Category, Product } from "@/lib/types/domain";
import type { ProductFormState } from "@/app/(admin)/admin/(protected)/produtos/actions";

const initialState: ProductFormState = { error: null };

/** Mesmo sentinel usado em produtos/actions.ts pra reconhecer que o usuário
 * escolheu "+ Nova categoria" em vez de uma categoria já existente. */
const NOVA_CATEGORIA = "__nova__";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

export function ProductForm({ product, categories, action, submitLabel }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [categoryValue, setCategoryValue] = useState(product?.categoryId ?? "");

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-brand-ink">
            Nome da raça
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="product_type" className="block text-sm font-medium text-brand-ink">
            Tipo
          </label>
          <select
            id="product_type"
            name="product_type"
            defaultValue={product?.productType ?? "ovo"}
            className={inputClass}
          >
            <option value="ovo">Ovo fértil</option>
            <option value="ave">Ave viva</option>
          </select>
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-brand-ink">
            Categoria
          </label>
          <select
            id="category_id"
            name="category_id"
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
            className={inputClass}
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NOVA_CATEGORIA}>+ Nova categoria</option>
          </select>
          {/* Categoria nova entra direto aqui — não existe mais uma tela
              separada só pra cadastrar categoria antes da raça. */}
          {categoryValue === NOVA_CATEGORIA && (
            <input
              id="nova_categoria"
              name="nova_categoria"
              type="text"
              required
              autoFocus
              placeholder="Nome da nova categoria (ex: Marrecos)"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-brand-ink">
            Preço (R$)
          </label>
          <input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="15,00"
            defaultValue={product?.price ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-brand-ink">
            Quantidade disponível
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-brand-ink">
            Limite de estoque baixo
          </label>
          <input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            min={0}
            defaultValue={product?.lowStockThreshold ?? 5}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-6 pt-6">
          <label className="flex items-center gap-2 text-sm text-brand-ink">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? false}
              className="h-4 w-4 rounded border-brand-sand text-brand-green focus:ring-brand-green"
            />
            Ativo (visível no site)
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-ink">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 rounded border-brand-sand text-brand-green focus:ring-brand-green"
            />
            Destaque na Home
          </label>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="short_description" className="block text-sm font-medium text-brand-ink">
            Descrição curta
          </label>
          <input
            id="short_description"
            name="short_description"
            type="text"
            defaultValue={product?.shortDescription ?? ""}
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-brand-ink">
            Descrição completa
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-green px-6 py-2.5 text-sm font-medium text-brand-cream hover:bg-brand-green-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
