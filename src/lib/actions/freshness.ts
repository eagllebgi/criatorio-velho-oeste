"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/cart/types";

export interface FreshnessWarning {
  productId: string;
  name: string;
  message: string;
}

/**
 * Confere, pro CEP informado no carrinho, se os ovos têm coleta fresca o
 * bastante pra garantir o envio até o destino:
 *   - coletado há até "diasNacional" dias -> pode enviar pra qualquer
 *     estado do Brasil
 *   - coletado há mais que "diasNacional" e até "diasLocal" dias -> só dá
 *     pra garantir dentro do estado configurado ("ufLocal")
 * Os três números são configuráveis pelo admin (ver
 * 0011_frescor_configuravel.sql, tela /admin/configuracoes) — lidos aqui
 * via `get_frescor_config` (SECURITY DEFINER, liberada pra "anon", mesmo
 * padrão de `ovo_freshness_buckets" abaixo, já que o carrinho do site roda
 * sem ninguém logado).
 *
 * NUNCA bloqueia o pedido — é só um aviso não-obrigatório (decisão do
 * Gabriel): o cliente sempre consegue continuar pelo WhatsApp mesmo que
 * apareça um aviso aqui. Se o CEP não puder ser resolvido (uf null, mesma
 * situação de falha silenciosa do lookupCep em lib/cep.ts), não tem como
 * saber o estado do cliente — não mostra nenhum aviso nesse caso.
 */
export async function checkFreshnessForCep(
  items: Pick<CartItem, "productId" | "name" | "productType">[],
  uf: string | null,
): Promise<FreshnessWarning[]> {
  if (!uf) return [];

  const ovos = items.filter((item) => item.productType === "ovo");
  if (ovos.length === 0) return [];

  const supabase = await createClient();

  const { data: config } = await supabase.rpc("get_frescor_config").maybeSingle();
  const ufLocal = config?.uf_local ?? "SP";

  const warnings: FreshnessWarning[] = [];

  for (const item of ovos) {
    const { data, error } = await supabase
      .rpc("ovo_freshness_buckets", { p_especie: item.name })
      .maybeSingle();

    if (error || !data) continue;

    const qtdAte5 = data.qtd_ate_5 ?? 0;
    const qtdAte7 = data.qtd_ate_7 ?? 0;
    const elegivel = uf === ufLocal ? qtdAte5 + qtdAte7 > 0 : qtdAte5 > 0;

    if (elegivel) continue;

    warnings.push({
      productId: item.productId,
      name: item.name,
      message:
        uf === ufLocal
          ? `${item.name}: sem coleta recente o suficiente no momento — o atendimento confirma a disponibilidade.`
          : `${item.name}: a coleta atual só está garantida pra envio dentro de ${ufLocal}. Pra fora de ${ufLocal}, o atendimento confirma a disponibilidade.`,
    });
  }

  return warnings;
}
