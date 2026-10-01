"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nextCodigo } from "@/lib/actions/codigo";
import { emojiForEspecie } from "@/lib/types/domain";

export interface ActionResult {
  error: string | null;
}

function revalidatePosturaPaths() {
  revalidatePath("/admin/postura");
  revalidatePath("/admin/baias");
  revalidatePath("/admin/aves");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  // A maioria das ações aqui (chocadeira, venda rápida, descarte, exclusão)
  // agora também ajusta o estoque de Ovo (ver adjustEstoqueOvo abaixo) —
  // precisa revalidar Produtos e o catálogo público pra essa mudança aparecer,
  // mesmo padrão usado em revalidateGestaoPaths (baias/actions.ts).
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Ajusta o estoque de Ovo da espécie da baia informada, somando `delta`
 * (pode ser negativo). Só lotes com destino "venda" chegaram a contribuir
 * pro estoque (gatilho de INSERT em lotes_postura — ver
 * 0008_postura_login_ave_stock.sql), então só eles devem ser descontados
 * aqui — chame isso apenas quando `lote.destino === "venda"`. Falha
 * silenciosamente (sem quebrar a ação principal) se a baia não for
 * encontrada; erros da própria função ficam pro chamador decidir. */
async function adjustEstoqueOvo(
  supabase: SupabaseClient,
  baiaId: string,
  delta: number,
): Promise<string | null> {
  if (delta === 0) return null;

  const { data: baia } = await supabase
    .from("baias")
    .select("especie")
    .eq("id", baiaId)
    .maybeSingle();
  if (!baia?.especie) return null;

  const { error } = await supabase.rpc("adjust_ovo_stock", {
    p_especie: baia.especie,
    p_delta: delta,
  });
  return error?.message ?? null;
}

/** Envia (todo ou parte) um lote pra chocadeira. Se a quantidade for menor que
 * o total do lote, separa em dois: o restante continua Disponível e um novo
 * lote nasce já Incubando — mesma lógica usada no protótipo de produção. */
export async function enviarChocadeira(loteId: string, quantidade: number): Promise<ActionResult> {
  if (!quantidade || quantidade <= 0) return { error: "Informe a quantidade." };

  const supabase = await createClient();
  const { data: lote, error: fetchError } = await supabase
    .from("lotes_postura")
    .select("*")
    .eq("id", loteId)
    .maybeSingle();

  if (fetchError || !lote) return { error: "Lote não encontrado." };
  if (quantidade > lote.quantidade) return { error: "Quantidade maior que o lote." };

  const eclosao = new Date();
  eclosao.setDate(eclosao.getDate() + 21);
  const eclosaoPrevista = eclosao.toISOString().split("T")[0];

  if (quantidade < lote.quantidade) {
    const restante = lote.quantidade - quantidade;
    const { error: updateError } = await supabase
      .from("lotes_postura")
      .update({ quantidade: restante })
      .eq("id", loteId);
    if (updateError) return { error: updateError.message };

    const codigo = await nextCodigo(supabase, "lotes_postura", "L", 4);
    const { error: insertError } = await supabase.from("lotes_postura").insert({
      codigo,
      baia_id: lote.baia_id,
      quantidade,
      preco_unit: lote.preco_unit,
      data_postura: lote.data_postura,
      destino: "choc",
      status: "Incubando",
      eclosao_prevista: eclosaoPrevista,
      lote_origem_id: lote.id,
    });
    if (insertError) return { error: insertError.message };
  } else {
    const { error: updateError } = await supabase
      .from("lotes_postura")
      .update({ status: "Incubando", destino: "choc", eclosao_prevista: eclosaoPrevista })
      .eq("id", loteId);
    if (updateError) return { error: updateError.message };
  }

  // A parte que foi pra chocadeira deixa de estar "Disponível" pra venda —
  // se o lote original era destino "venda", ele tinha somado ao estoque de
  // Ovo quando nasceu, então desconta agora a quantidade que saiu.
  if (lote.destino === "venda") {
    const stockError = await adjustEstoqueOvo(supabase, lote.baia_id, -quantidade);
    if (stockError) return { error: stockError };
  }

  revalidatePosturaPaths();
  return { error: null };
}

/** Registra o nascimento: fecha o lote e cria uma ave individual pra cada
 * filhote nascido, já vinculada à mesma baia. */
export async function registrarNascimento(loteId: string, nascidos: number): Promise<ActionResult> {
  if (nascidos < 0) return { error: "Quantidade inválida." };

  const supabase = await createClient();
  const { data: lote, error: fetchError } = await supabase
    .from("lotes_postura")
    .select("*, baias ( especie )")
    .eq("id", loteId)
    .maybeSingle();

  if (fetchError || !lote) return { error: "Lote não encontrado." };

  const { error: updateError } = await supabase
    .from("lotes_postura")
    .update({ status: "Concluído" })
    .eq("id", loteId);
  if (updateError) return { error: updateError.message };

  if (nascidos > 0) {
    const especie = (lote.baias as { especie: string } | null)?.especie ?? "Ave";
    const hoje = new Date().toISOString().split("T")[0];
    const novasAves = Array.from({ length: nascidos }, (_, i) => ({
      codigo: `${lote.codigo}-F${i + 1}-${Date.now().toString(36).toUpperCase()}${i}`,
      baia_id: lote.baia_id,
      nome: especie,
      emoji: emojiForEspecie(especie),
      sexo: "Indefinido" as const,
      status: "Filhote" as const,
      data_nascimento: hoje,
    }));

    const { error: insertError } = await supabase.from("aves").insert(novasAves);
    if (insertError) return { error: insertError.message };
  }

  revalidatePosturaPaths();
  return { error: null };
}

/** Venda rápida: reduz a quantidade do lote (sem separar, ao contrário da
 * chocadeira — o que sai simplesmente deixa de existir no lote) e lança a
 * entrada automaticamente no financeiro. */
export async function venderLoteRapido(loteId: string, quantidade: number): Promise<ActionResult> {
  if (!quantidade || quantidade <= 0) return { error: "Informe a quantidade." };

  const supabase = await createClient();
  const { data: lote, error: fetchError } = await supabase
    .from("lotes_postura")
    .select("*")
    .eq("id", loteId)
    .maybeSingle();

  if (fetchError || !lote) return { error: "Lote não encontrado." };
  if (quantidade > lote.quantidade) return { error: "Quantidade maior que o disponível." };

  const restante = lote.quantidade - quantidade;
  const { error: updateError } = await supabase
    .from("lotes_postura")
    .update({ quantidade: Math.max(restante, 0), status: restante <= 0 ? "Vendido" : "Disponível" })
    .eq("id", loteId);
  if (updateError) return { error: updateError.message };

  const valorUnit = lote.preco_unit ?? 0;
  const total = quantidade * valorUnit;
  if (total > 0) {
    const { error: financeiroError } = await supabase.from("financeiro").insert({
      tipo: "entrada",
      descricao: `Venda de ovos — Lote ${lote.codigo}`,
      categoria: "Venda rápida",
      valor: total,
    });
    if (financeiroError) return { error: financeiroError.message };
  }

  // O que foi vendido sai do estoque de Ovo (só descontava na venda pelo site
  // via Financeiro "Venda de produto" — essa venda direto pelo lote nunca
  // tinha mexido no estoque).
  if (lote.destino === "venda") {
    const stockError = await adjustEstoqueOvo(supabase, lote.baia_id, -quantidade);
    if (stockError) return { error: stockError };
  }

  revalidatePosturaPaths();
  return { error: null };
}

/** Ações simples de troca de status: devolver aos disponíveis, disponibilizar
 * um lote reservado, ou descartar. Ajusta o estoque de Ovo na transição,
 * já que um lote "Descartado" não deve continuar contando como disponível
 * pra venda, e um lote que volta de "Descartado" pra "Disponível" deve
 * voltar a contar. */
export async function atualizarStatusLote(
  loteId: string,
  status: "Disponível" | "Descartado",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: lote, error: fetchError } = await supabase
    .from("lotes_postura")
    .select("baia_id, destino, quantidade, status")
    .eq("id", loteId)
    .maybeSingle();
  if (fetchError || !lote) return { error: "Lote não encontrado." };

  const { error } = await supabase.from("lotes_postura").update({ status }).eq("id", loteId);
  if (error) return { error: error.message };

  if (lote.destino === "venda") {
    if (status === "Descartado" && lote.status === "Disponível") {
      const stockError = await adjustEstoqueOvo(supabase, lote.baia_id, -lote.quantidade);
      if (stockError) return { error: stockError };
    } else if (status === "Disponível" && lote.status === "Descartado") {
      const stockError = await adjustEstoqueOvo(supabase, lote.baia_id, lote.quantidade);
      if (stockError) return { error: stockError };
    }
  }

  revalidatePosturaPaths();
  return { error: null };
}

export async function deleteLote(loteId: string) {
  const supabase = await createClient();
  const { data: lote } = await supabase
    .from("lotes_postura")
    .select("baia_id, destino, quantidade, status")
    .eq("id", loteId)
    .maybeSingle();

  await supabase.from("lotes_postura").delete().eq("id", loteId);

  // Se o lote excluído ainda estava "Disponível" com destino "venda", ele
  // ainda estava contando no estoque de Ovo — desconta antes de sumir,
  // senão o produto fica com estoque "fantasma" que nunca mais existiu.
  if (lote?.destino === "venda" && lote.status === "Disponível") {
    await adjustEstoqueOvo(supabase, lote.baia_id, -lote.quantidade);
  }

  revalidatePosturaPaths();
}
