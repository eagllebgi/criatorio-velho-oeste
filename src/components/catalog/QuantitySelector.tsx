"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function QuantitySelector({ value, max, onChange, disabled }: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-brand-sand">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10 disabled:opacity-30"
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-7 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-full text-brand-green hover:bg-brand-green/10 disabled:opacity-30"
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
