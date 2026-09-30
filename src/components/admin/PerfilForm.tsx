"use client";

import { useActionState, useState } from "react";
import {
  updateProfile,
  type PerfilState,
} from "@/app/(admin)/admin/(protected)/perfil/actions";

const initialState: PerfilState = { error: null, success: false };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green";

export function PerfilForm({ email, telefone }: { email: string; telefone: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-2xl border border-brand-sand/70 bg-white p-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={email}
          autoComplete="username"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-brand-ink/50">
          Trocar o e-mail pede confirmação: chega um link no e-mail novo antes de valer.
        </p>
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-brand-ink">
          Telefone
        </label>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          placeholder="(00) 00000-0000"
          defaultValue={telefone}
          autoComplete="tel"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-brand-ink/50">
          Guardado no seu perfil pra uso futuro — hoje ainda não dispara
          nenhum aviso automático. Os avisos de prazo de envio aparecem aqui
          dentro do painel, no Dashboard.
        </p>
      </div>

      <div className="border-t border-brand-sand/70 pt-4">
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="text-sm font-medium text-brand-green hover:underline"
        >
          {showPassword ? "Cancelar troca de senha" : "Trocar senha"}
        </button>

        {showPassword && (
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-ink">
                Nova senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                placeholder="Deixe em branco para manter a atual"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-brand-ink">
                Confirmar nova senha
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && !state.error && (
        <p className="text-sm text-brand-green">Perfil atualizado.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-medium text-brand-cream transition-colors hover:bg-brand-green-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
