"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nextCodigo } from "@/lib/actions/codigo";
import { parsePriceInput } from "@/lib/utils";
import { emojiForEspecie, type AveStatus } from "@/lib/types/domain";

export interface FormState {
  error: string | null;
}

function revalidateGestaoPaths() {
  revalidatePath("/admin/baias");
  // Plantel (/admin/aves) mostra o nome da baia de cada ave (relação
  // aves.baia_id -> baias.nome) e a baixa por status também afeta a
  // contagem exibida nos cards de baia — mantém as duas telas sempre em dia
  // uma com a outra, sem precisar de reload manual.
  revalidatePath("/admin/aves");
  revalidatePath("/admin/postura");
  revalidatePath("/admin");
  // Registrar postura com destino "Venda" já atualiza sozinho o estoque da
  // raça de Ovo correspondente (gatilho no banco, ver 0008_postura_login_ave_stock.sql)
  // — precisa revalidar Produtos e o catálogo público pra essa mudança aparecer.
  revalidatePath("/admin/produtos");
  revalidatePath("/ovos");
  revalidatePath("/ovos/[slug]", "page");
}

// ── Baias ─────────────────────────────────────────────────────────────────

function parseBaiaForm(formData: FormData) {
  const numero = String(formData.get("numero") ?? "").trim();
  const especie = String(formData.get("especie") ?? "").trim();
  const nomeInput = String(formData.get("nome") ?? "").trim();
  const setor = String(formData.get("setor") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "Ativa");
  const precoOvo = parsePriceInput(String(formData.get("preco_ovo") ?? ""));
  const destinoPadrao = String(formData.get("destino_padrao") ?? "venda");
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  // Nome sugerido automaticamente a partir do número + espécie, a não ser
  // que o usuário tenha digitado um nome próprio — mesmo comportamento que
  // já era usado no protótipo do painel de produção.
  const nome = nomeInput || (numero && especie ? `Baia ${numero} — ${especie}` : numero || especie);

  return { numero, especie, nome, setor, status, precoOvo, destinoPadrao, observacoes };
}

/** Monta as linhas de `aves` pra um lote de machos + fêmeas de uma vez — já
 * vinculadas à baia, com o nome da espécie (editável depois, igual a
 * qualquer ave) e código sequencial próprio, mesmo padrão usado no
 * nascimento automático (ver registrarNascimento em postura/actions.ts).
 * Pensado pra aves "prontas" (reprodutoras, disponíveis etc.) sendo
 * cadastradas em lote — não pra filhotes recém-nascidos, que continuam
 * sendo criados um a um por lá. */
function montarNovasAves(
  especie: string,
  baiaId: string,
  machos: number,
  femeas: number,
  status: AveStatus,
) {
  const emoji = emojiForEspecie(especie);
  const prefixo = Date.now().toString(36).toUpperCase();
  const itens = [
    ...Array.from({ length: machos }, (_, i) => ({ sexo: "Macho" as const, i })),
    ...Array.from({ length: femeas }, (_, i) => ({ sexo: "Fêmea" as const, i: machos + i })),
  ];
  return itens.map(({ sexo, i }) => ({
    codigo: `AVE-${prefixo}-${i}`,
    baia_id: baiaId,
    nome: especie,
    emoji,
    sexo,
    status,
  }));
}

/** Cria a baia e, opcionalmente, já cadastra um lote de aves dentro dela de
 * uma vez (machos + fêmeas) — pra não ter que criar a baia e depois ir uma
 * por uma no Plantel. Os campos "aves_machos"/"aves_femeas"/"aves_status"
 * só existem no formulário de baia NOVA (ver BaiaFormSheet); editar uma
 * baia existente nunca mexe nas aves dela por aqui — isso é feito pelo
 * botão "+ Adicionar aves" dentro de "Ver aves" (ver aves/actions.ts). */
export async function createBaia(_prevState: FormState, formData: FormData): Promise<FormState> {
  const values = parseBaiaForm(formData);
  if (!values.numero) return { error: "Informe o número da baia." };
  if (!values.especie) return { error: "Informe a espécie." };

  const avesMachos = Math.max(0, Math.trunc(Number(formData.get("aves_machos")) || 0));
  const avesFemeas = Math.max(0, Math.trunc(Number(formData.get("aves_femeas")) || 0));
  const avesStatus = (String(formData.get("aves_status") ?? "Disponível") || "Disponível") as AveStatus;

  const supabase = await createClient();
  const codigo = await nextCodigo(supabase, "baias", "B", 3);

  const { data: baia, error } = await supabase
    .from("baias")
    .insert({
      codigo,
      numero: values.numero,
      nome: values.nome,
      especie: values.especie,
      setor: values.setor,
      status: values.status as "Reprodução" | "Ativa" | "Inativa",
      preco_ovo: values.precoOvo,
      destino_padrao: values.destinoPadrao as "venda" | "choc" | "reservado" | "descarte",
      observacoes: values.observacoes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (avesMachos + avesFemeas > 0 && baia) {
    const novasAves = montarNovasAves(values.especie, baia.id, avesMachos, avesFemeas, avesStatus);
    const { error: avesError } = await supabase.from("aves").insert(novasAves);
    if (avesError) {
      return {
        error: `A baia foi criada, mas não deu pra cadastrar as aves: ${avesError.message}. Adicione elas depois em "Ver aves".`,
      };
    }
  }

  revalidateGestaoPaths();
  return { error: null };
}

export async function updateBaia(
  baiaId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = parseBaiaForm(formData);
  if (!values.numero) return { error: "Informe o número da baia." };
  if (!values.especie) return { error: "Informe a espécie." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("baias")
    .update({
      numero: values.numero,
      nome: values.nome,
      especie: values.especie,
      setor: values.setor,
      status: values.status as "Reprodução" | "Ativa" | "Inativa",
      preco_ovo: values.precoOvo,
      destino_padrao: values.destinoPadrao as "venda" | "choc" | "reservado" | "descarte",
      observacoes: values.observacoes,
    })
    .eq("id", baiaId);

  if (error) return { error: error.message };
  revalidateGestaoPaths();
  return { error: null };
}

export async function deleteBaia(baiaId: string) {
  const supabase = await createClient();
  await supabase.from("baias").delete().eq("id", baiaId);
  revalidateGestaoPaths();
  revalidatePath("/admin/aves");
}

// Edição rápida de status e destino padrão direto no card, sem abrir o painel
// de edição completo — só esses dois campos, que são os que mais mudam no
// dia a dia (ex: baia entrou em reprodução, ou passou a incubar em vez de
// vender os ovos).
export async function updateBaiaStatusQuick(
  baiaId: string,
  status: "Reprodução" | "Ativa" | "Inativa",
): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("baias").update({ status }).eq("id", baiaId);
  if (error) return { error: error.message };
  revalidateGestaoPaths();
  return { error: null };
}

export async function updateBaiaDestinoQuick(
  baiaId: string,
  destinoPadrao: "venda" | "choc" | "reservado" | "descarte",
): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("baias")
    .update({ destino_padrao: destinoPadrao })
    .eq("id", baiaId);
  if (error) return { error: error.message };
  revalidateGestaoPaths();
  return { error: null };
}

// ── Observações ───────────────────────────────────────────────────────────

export async function createObservacao(baiaId: string, texto: string): Promise<FormState> {
  const trimmed = texto.trim();
  if (!trimmed) return { error: "Escreva algo antes de salvar." };

  const supabase = await createClient();
  const { error } = await supabase.from("baia_observacoes").insert({ baia_id: baiaId, texto: trimmed });

  if (error) return { error: error.message };
  revalidatePath("/admin/baias");
  return { error: null };
}

// ── Postura (novo lote de ovos) ──────────────────────────────────────────

interface PosturaItem {
  destino: "venda" | "choc" | "reservado" | "descarte";
  quantidade: number;
}

/** Um único lançamento de postura pode ter quantidades diferentes indo pra
 * destinos diferentes de uma vez (ex: "10 pra chocadeira, 20 pra venda") —
 * o formulário monta essa lista e manda como JSON no campo "itens" em vez de
 * um destino/quantidade só. Cada item vira seu próprio lote (com código
 * sequencial próprio), exatamente como se tivesse sido lançado um de cada
 * vez. Destino "Venda" já atualiza sozinho o estoque da raça de Ovo
 * correspondente (gatilho no banco — ver 0008_postura_login_ave_stock.sql). */
export async function createPostura(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const baiaId = String(formData.get("baia_id") ?? "");
  const dataPostura = String(formData.get("data_postura") ?? "").trim() || undefined;
  const precoInput = parsePriceInput(String(formData.get("preco_unit") ?? ""));

  let itens: PosturaItem[];
  try {
    itens = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    return { error: "Não foi possível ler as quantidades informadas." };
  }

  if (!baiaId) return { error: "Baia inválida." };
  if (!Array.isArray(itens) || itens.length === 0) {
    return { error: "Informe a quantidade de ovos." };
  }
  for (const item of itens) {
    if (!item.quantidade || item.quantidade <= 0) {
      return { error: "Informe a quantidade de ovos em cada destino." };
    }
  }

  const supabase = await createClient();

  const { data: baia } = await supabase
    .from("baias")
    .select("preco_ovo")
    .eq("id", baiaId)
    .maybeSingle();

  const precoUnit = precoInput ?? baia?.preco_ovo ?? null;

  // Mesma lógica do protótipo pra cada item: o destino escolhido já define o
  // status e, quando vai direto pra chocadeira, calcula a previsão de
  // eclosão (21 dias é o padrão da maioria das aves domésticas).
  const baseDate = dataPostura ? new Date(`${dataPostura}T00:00:00`) : new Date();

  for (const item of itens) {
    let status: "Disponível" | "Incubando" | "Reservado" | "Descartado" = "Disponível";
    let eclosaoPrevista: string | null = null;

    if (item.destino === "choc") {
      status = "Incubando";
      const eclosao = new Date(baseDate);
      eclosao.setDate(eclosao.getDate() + 21);
      eclosaoPrevista = eclosao.toISOString().split("T")[0];
    } else if (item.destino === "reservado") {
      status = "Reservado";
    } else if (item.destino === "descarte") {
      status = "Descartado";
    }

    const codigo = await nextCodigo(supabase, "lotes_postura", "L", 4);

    const { error } = await supabase.from("lotes_postura").insert({
      codigo,
      baia_id: baiaId,
      quantidade: item.quantidade,
      preco_unit: precoUnit,
      destino: item.destino,
      status,
      eclosao_prevista: eclosaoPrevista,
      ...(dataPostura ? { data_postura: dataPostura } : {}),
    });

    if (error) return { error: error.message };
  }

  revalidateGestaoPaths();
  return { error: null };
}
