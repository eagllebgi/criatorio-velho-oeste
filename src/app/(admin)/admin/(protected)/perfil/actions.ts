"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PerfilState {
  error: string | null;
  success: boolean;
}

/** Atualiza e-mail, telefone e (opcionalmente) senha da conta de admin
 * logada — self-service, sem chave de serviço nem tabela nova: o telefone
 * fica guardado em user_metadata (auth.users), o resto é o próprio Supabase
 * Auth. Não existe ainda convite/criação de outras contas de admin — só a
 * própria conta, por decisão do Gabriel (ver pedido do módulo de frescor). */
export async function updateProfile(
  _prevState: PerfilState,
  formData: FormData,
): Promise<PerfilState> {
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email) {
    return { error: "Informe o e-mail.", success: false };
  }

  if (password || confirmPassword) {
    if (password.length < 6) {
      return { error: "A nova senha precisa ter pelo menos 6 caracteres.", success: false };
    }
    if (password !== confirmPassword) {
      return { error: "As senhas não coincidem.", success: false };
    }
  }

  const supabase = await createClient();

  const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
    email,
    data: { telefone },
  };
  if (password) updates.password = password;

  const { error } = await supabase.auth.updateUser(updates);

  if (error) {
    return { error: `Não foi possível salvar: ${error.message}`, success: false };
  }

  revalidatePath("/admin/perfil");
  return { error: null, success: true };
}
