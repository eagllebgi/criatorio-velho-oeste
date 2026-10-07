import type { Product } from "@/lib/types/domain";
import { formatBRL } from "@/lib/utils";

/**
 * Tabela de preço por idade, mostrada na página da própria ave quando pelo
 * menos uma das 4 faixas (ver migration 0012) está preenchida. Só
 * informativa — o preço "oficial" pro pedido continua sendo o preço único
 * (campo Preço do produto, mostrado acima), que o cliente manda pelo
 * WhatsApp; aqui ele já vê como o valor muda conforme a idade, antes de
 * chamar.
 */
export function AveAgePriceTable({ product }: { product: Product }) {
  if (product.productType !== "ave") return null;

  const faixas = [
    { label: "1 a 30 dias", price: product.price1To30 },
    { label: "31 a 60 dias", price: product.price31To60 },
    { label: "61 a 90 dias", price: product.price61To90 },
    { label: "91 a 120 dias", price: product.price91To120 },
  ].filter((f) => f.price !== null);

  if (faixas.length === 0) return null;

  return (
    <div className="rounded-xl border border-brand-sand bg-white/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink/50">
        Preço por idade da ave
      </p>
      <ul className="mt-2 space-y-1.5">
        {faixas.map((f) => (
          <li key={f.label} className="flex items-center justify-between text-sm">
            <span className="text-brand-ink/70">{f.label}</span>
            <span className="font-medium text-brand-ink">{formatBRL(f.price)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-xs text-brand-ink/45">
        O valor final é confirmado pelo WhatsApp, conforme a idade das aves disponíveis no
        momento.
      </p>
    </div>
  );
}
