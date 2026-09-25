"use client";

import { useActionState, useState } from "react";
import type { Category, Product } from "@/lib/types/domain";
import type { ProductFormState } from "@/app/(admin)/admin/(protected)/produtos/actions";

const initialState: ProductFormState = { error: null };

/** Mesmo sentinel usado em produtos/actions.ts pra reconhecer que o usuário
 * escolheu "+ Nova categoria" em vez de uma categoria já existente. */
const NOVA_CATEGORIA = "__nova__";

/** Sentinel equivalente pro seletor de raça: escolher isso revela o campo de
 * texto pra digitar o nome de uma raça nova. Ao contrário da categoria (que
 * é uma tabela separada com FK), a raça é só o nome do próprio produto —
 * então aqui não precisa de nenhum passo no servidor pra "resolver": o
 * <select> e o <input> de texto nunca ficam com name="name" ativo ao mesmo
 * tempo, então só um dos dois é enviado no formulário. */
const NOVA_RACA = "__nova__";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  /** Nomes de raças já cadastradas no catálogo (sem repetir), pra reaproveitar
   * em vez de digitar tudo de novo — útil principalmente quando a mesma raça
   * vai virar tanto um anúncio de Ovo quanto de Ave. */
  existingNames: string[];
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

export function ProductForm({
  product,
  categories,
  existingNames,
  action,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [categoryValue, setCategoryValue] = useState(product?.categoryId ?? "");
  const [racaValue, setRacaValue] = useState(() => {
    if (!product) return NOVA_RACA;
    return existingNames.includes(product.name) ? product.name : NOVA_RACA;
  });
  const [productType, setProductType] = useState(product?.productType ?? "ovo");
  const isAve = productType === "ave";

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="product_type" className="block text-sm font-medium text-brand-ink">
            Tipo do anúncio
          </label>
          <select
            id="product_type"
            name="product_type"
            value={productType}
            onChange={(e) => setProductType(e.target.value as "ovo" | "ave")}
            className={inputClass}
          >
            <option value="ovo">Ovo fértil</option>
            <option value="ave">Ave viva</option>
          </select>
          <p className="mt-1.5 text-xs text-brand-ink/50">
            A mesma raça pode ter um anúncio de Ovo e outro de Ave separadamente — é só cadastrar
            os dois com o mesmo nome, escolhendo esse nome na lista abaixo da segunda vez.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="raca_nome" className="block text-sm font-medium text-brand-ink">
            Raça
          </label>
          <select
            id="raca_nome"
            value={racaValue}
            onChange={(e) => setRacaValue(e.target.value)}
            className={inputClass}
            {...(racaValue !== NOVA_RACA ? { name: "name" } : {})}
          >
            <option value={NOVA_RACA}>+ Nova raça</option>
            {existingNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {/* Raça nova entra direto aqui, igual ao padrão de "+ Nova
              categoria" abaixo — sem precisar de outra tela antes. */}
          {racaValue === NOVA_RACA && (
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="Ex: Ayam Cemani"
              defaultValue={product && !existingNames.includes(product.name) ? product.name : ""}
              className={`${inputClass} mt-2`}
            />
          )}
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
          {isAve ? (
            <>
              {/* Estoque de Ave não é digitado — é calculado sozinho contando
                  quantas aves dessa raça estão "Disponível" no Plantel (ver
                  0008_postura_login_ave_stock.sql). Cadastrar uma ave nova
                  disponível pra venda no Plantel (com a anilha dela) já
                  atualiza esse número automaticamente. */}
              <input
                id="stock"
                type="number"
                value={product?.stock ?? 0}
                disabled
                readOnly
                className={`${inputClass} cursor-not-allowed bg-brand-cream-dark/40 text-brand-ink/50`}
              />
              <p className="mt-1.5 text-xs text-brand-ink/50">
                Calculado automaticamente a partir das aves &quot;Disponível&quot; no Plantel — para
                mudar, cadastre ou dê baixa em{" "}
                <a href="/admin/aves" className="text-brand-green underline hover:no-underline">
                  Plantel
                </a>
                .
              </p>
            </>
          ) : (
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              defaultValue={product?.stock ?? 0}
              className={inputClass}
            />
          )}
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
