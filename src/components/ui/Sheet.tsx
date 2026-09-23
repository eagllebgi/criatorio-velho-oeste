"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Ações fixas na base do painel (ex: botão salvar). */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Painel lateral (desktop) / tela cheia (mobile) reutilizável para ações
 * rápidas do admin: novo lançamento, editar ave, registrar postura, etc.
 * Renderiza num portal direto no <body> pelo mesmo motivo do MobileMenu —
 * escapar do "backdrop-blur" do cabeçalho, que prende elementos "fixed".
 */
export function Sheet({ open, onClose, title, children, footer, className }: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Flag "já montou no cliente" pra poder usar createPortal com segurança
    // (evita divergência de hidratação entre servidor e navegador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col bg-brand-cream shadow-2xl",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-sand px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-brand-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand-ink/60 hover:bg-brand-ink/5"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="space-y-3 border-t border-brand-sand px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
