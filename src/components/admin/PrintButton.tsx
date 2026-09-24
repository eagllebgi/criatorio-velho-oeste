"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Botão simples que aciona a impressão do navegador (window.print) — some
 * sozinho na hora de imprimir por causa da classe "no-print" no Button. */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="no-print">
      <Printer className="h-4 w-4" aria-hidden="true" />
      Imprimir
    </Button>
  );
}
