"use client";

import { useEffect, useState } from "react";
import { formatCep, isValidCepFormat, lookupCep, type CepAddress } from "@/lib/cep";

interface CepInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CepInput({ value, onChange }: CepInputProps) {
  const [lookup, setLookup] = useState<{ cep: string; result: CepAddress | null } | null>(
    null,
  );

  useEffect(() => {
    if (!isValidCepFormat(value)) return;

    let cancelled = false;
    lookupCep(value).then((result) => {
      if (cancelled) return;
      setLookup({ cep: value, result });
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  const touched = value.length > 0;
  const showFormatError = touched && !isValidCepFormat(value) && value.length >= 8;
  const isCurrentLookup = isValidCepFormat(value) && lookup?.cep === value;
  const status: "idle" | "loading" | "found" | "not-found" = !isValidCepFormat(value)
    ? "idle"
    : !isCurrentLookup
      ? "loading"
      : lookup?.result
        ? "found"
        : "not-found";
  const address =
    isCurrentLookup && lookup?.result
      ? `${lookup.result.city}${lookup.result.city && lookup.result.state ? " - " : ""}${lookup.result.state}`
      : null;

  return (
    <div>
      <label htmlFor="cep" className="block text-sm font-medium text-brand-ink">
        CEP de entrega
      </label>
      <input
        id="cep"
        name="cep"
        type="text"
        inputMode="numeric"
        placeholder="00000-000"
        autoComplete="postal-code"
        value={value}
        onChange={(e) => onChange(formatCep(e.target.value))}
        aria-invalid={showFormatError}
        aria-describedby="cep-hint"
        className="mt-1.5 w-full rounded-lg border border-brand-sand bg-white px-4 py-2.5 text-sm text-brand-ink outline-none transition-colors focus:border-brand-green focus:ring-1 focus:ring-brand-green"
      />
      <p id="cep-hint" className="mt-1.5 text-xs">
        {showFormatError && (
          <span className="text-red-600">Informe um CEP válido, ex: 16200-000.</span>
        )}
        {!showFormatError && status === "loading" && (
          <span className="text-brand-ink/50">Consultando CEP...</span>
        )}
        {!showFormatError && status === "found" && address && (
          <span className="text-brand-green">Endereço: {address}</span>
        )}
        {!showFormatError && status === "not-found" && (
          <span className="text-brand-ink/50">
            Não conseguimos confirmar este CEP automaticamente, mas você pode
            continuar normalmente.
          </span>
        )}
        {!showFormatError && status === "idle" && !touched && (
          <span className="text-brand-ink/50">
            Usado apenas para o atendimento calcular o envio.
          </span>
        )}
      </p>
    </div>
  );
}
