"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emojiForEspecie, type AveSexo, type AveStatus } from "@/lib/types/domain";

export interface FormState {
  error: string | null;
}

function revalidateAvesPaths() {
  revalidatePath("/admin/aves");
  // A contagem de aves exibida nos cards de baia (totalAves/machos/femeas)
  // é calculada a partir da tabela `aves` — qualquer criação, edição, baixa
  // ou exclusão de ave precisa refletir lá também, senão o card de baia pode
  // ficar mostrando um número desatualizado até um reload manual.
  revalidatePath("/admin/baias");
  revalidatePath("/admin");
}

/** Erro de violação de índice único do Postgres (ex: anilha duplicada). */
function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

function parseAveForm(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const baiaId = String(formData.get("baia_id") ?? "") || null;
  const anilha = String(formData.get("anilha") ?? "").trim() || null;
  const sexo = String(formData.get("sexo") ?? "Indefinido") as AveSexo;
  const status = String(formData.get("status") ?? "Filhote") as AveStatus;
  const dataNascimento = String(formData.get("data_nascimento") ?? "").trim() || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  return { nome, baiaId, anilha, sexo, status, dataNascimento, observacoes };
}

export async function createAve(_prevState: FormState, formData: FormData): Promise<FormState> {
  const values = parseAveForm(formData);
  if (!values.nome) return { error: "Informe um nome para identificar a ave." };

  const supabase = await createClient();
  const codigo = `AVE-${Date.now().toString(36).toUpperCase()}`;

  const { error } = await supabase.from("aves").insert({
    codigo,
    baia_id: values.baiaId,
    nome: values.nome,
    emoji: emojiForEspecie(values.nome),
    anilha: values.anilha,
    sexo: values.sexo,
    status: values.status,
    data_nascimento: values.dataNascimento,
    observacoes: values.observacoes,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: `Já existe uma ave cadastrada com a anilha "${values.anilha}".` };
    }
    return { error: error.message };
  }
  revalidateAvesPaths();
  return { error: null };
}

export async function updateAve(
  aveId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = parseAveForm(formData);
  if (!values.nome) return { error: "Informe um nome para identificar a ave." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aves")
    .update({
      baia_id: values.baiaId,
      nome: values.nome,
      emoji: emojiForEspecie(values.nome),
      anilha: values.anilha,
      sexo: values.sexo,
      status: values.status,
      data_nascimento: values.dataNascimento,
      observacoes: values.observacoes,
    })
    .eq("id", aveId);

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: `Já existe uma ave cadastrada com a anilha "${values.anilha}".` };
    }
    return { error: error.message };
  }
  revalidateAvesPaths();
  return { error: null };
}

export async function deleteAve(aveId: string) {
  const supabase = await createClient();
  await supabase.from("aves").delete().eq("id", aveId);
  revalidateAvesPaths();
}

// ── Baixa por anilha ─────────────────────────────────────────────────────

export interface BaixaResult {
  error: string | null;
  /** Nome da ave, devolvido em caso de sucesso — pra confirmar na tela quem
   * recebeu a baixa sem precisar ficar trocando de tela. */
  aveNome?: string;
}

/** Dá baixa (Vendido ou Óbito) numa ave a partir do número da anilha, sem
 * precisar abrir o cadastro dela. O novo status já tira a ave da contagem
 * da baia automaticamente (ver mapBaia em lib/data/mappers.ts), então não é
 * preciso desvincular a baia manualmente. */
export async function darBaixaPorAnilha(
  anilha: string,
  motivo: Extract<AveStatus, "Vendido" | "Óbito">,
): Promise<BaixaResult> {
  const trimmed = anilha.trim();
  if (!trimmed) return { error: "Informe o número da anilha." };

  const supabase = await createClient();
  const { data: ave, error: findError } = await supabase
    .from("aves")
    .select("id, nome, status")
    .eq("anilha", trimmed)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (!ave) return { error: `Nenhuma ave encontrada com a anilha "${trimmed}".` };
  if (ave.status === "Vendido" || ave.status === "Óbito") {
    return { error: `"${ave.nome}" já está marcada como ${ave.status}.` };
  }

  const { error } = await supabase.from("aves").update({ status: motivo }).eq("id", ave.id);
  if (error) return { error: error.message };

  revalidateAvesPaths();
  return { error: null, aveNome: ave.nome };
}

// Upload de foto (ave/baia) acontece direto no navegador — Storage + update
// da coluna via cliente Supabase do browser, mesmo padrão do PhotoCell de
// Produtos (ver AdminProductTable.tsx) — não precisa de server action.
