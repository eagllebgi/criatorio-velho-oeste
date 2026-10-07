"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, Loader2 } from "lucide-react";
import { setPreviewMode } from "@/lib/actions/preview";

/**
 * Barra no topo das páginas públicas, só pro admin logado. Dois estados:
 *
 * - Normal: avisa que ele está vendo informação extra (estoque exato,
 *   controles de edição) e oferece "Ver como visitante" pra conferir como um
 *   cliente comum enxerga a página, sem precisar abrir outro navegador /
 *   aba anônima.
 * - Em preview: barra diferente (fundo escuro, pra não confundir com a
 *   normal), avisando que ele está vendo a versão de visitante, com um botão
 *   pra voltar na hora.
 *
 * O toggle é só um cookie (ver @/lib/actions/preview.ts e
 * getEffectiveAdminUser em @/lib/supabase/server.ts) — a sessão de admin
 * nunca desloga, então "Ir para o painel" continua funcionando nos dois
 * estados.
 */
export function AdminPreviewBar({ previewing }: { previewing: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      await setPreviewMode(next);
    });
  }

  if (previewing) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-brand-ink px-4 py-2 text-center text-xs font-medium text-brand-cream sm:text-sm">
        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Vendo como um visitante comum vê o site — sem estoque exato nem controles de edição.</span>
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={isPending}
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          Voltar pra visão admin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-brand-gold px-4 py-2 text-center text-xs font-medium text-brand-ink sm:text-sm">
      <span>Modo administrador: só você vê o estoque exato e pode editar direto na página.</span>
      <button
        type="button"
        onClick={() => toggle(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        Ver como visitante
      </button>
      <Link href="/admin" className="underline underline-offset-2 hover:no-underline">
        Ir para o painel
      </Link>
    </div>
  );
}
