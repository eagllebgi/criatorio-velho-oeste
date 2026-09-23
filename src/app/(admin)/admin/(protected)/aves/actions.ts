"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emojiForEspecie, type AveSexo, type AveStatus } from "@/lib/types/domain";

export interface FormState {
  error: string | null;
}

function revalidateAvesPaths() {
  revalidatePath("/admin/aves");
  revalidatePath("/admin");
}

function parseAveForm(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const baiaId = String(formData.get("baia_id") ?? "") || null;
  const sexo = String(formData.get("sexo") ?? "Indefinido") as AveSexo;
  const status = String(formData.get("status") ?? "Filhote") as AveStatus;
  const dataNascimento = String(formData.get("data_nascimento") ?? "").trim() || null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  return { nome, baiaId, sexo, status, dataNascimento, observacoes };
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
    sexo: values.sexo,
    status: values.status,
    data_nascimento: values.dataNascimento,
    observacoes: values.observacoes,
  });

  if (error) return { error: error.message };
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
      sexo: values.sexo,
      status: values.status,
      data_nascimento: values.dataNascimento,
      observacoes: values.observacoes,
    })
    .eq("id", aveId);

  if (error) return { error: error.message };
  revalidateAvesPaths();
  return { error: null };
}

export async function deleteAve(aveId: string) {
  const supabase = await createClient();
  await supabase.from("aves").delete().eq("id", aveId);
  revalidateAvesPaths();
}
