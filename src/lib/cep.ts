const CEP_REGEX = /^\d{5}-?\d{3}$/;

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCepFormat(value: string): boolean {
  return CEP_REGEX.test(value.trim());
}

export interface CepAddress {
  cep: string;
  city: string;
  state: string;
  neighborhood: string;
  street: string;
}

/**
 * Consulta o CEP em um serviço externo (ViaCEP) apenas para exibir a
 * cidade/UF ao cliente como confirmação visual. Nunca deve bloquear o envio
 * do pedido: qualquer falha (rede, timeout, serviço fora do ar) é tratada
 * silenciosamente retornando null.
 */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  if (!isValidCepFormat(cep)) return null;
  const digits = cep.replace(/\D/g, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: formatCep(digits),
      city: data.localidade ?? "",
      state: data.uf ?? "",
      neighborhood: data.bairro ?? "",
      street: data.logradouro ?? "",
    };
  } catch {
    return null;
  }
}
