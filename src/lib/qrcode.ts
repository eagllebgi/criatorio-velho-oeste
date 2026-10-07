import QRCode from "qrcode";
import { siteConfig } from "@/lib/config/site";

/**
 * Monta o link público de coleta de ovos por QR Code a partir do token da
 * baia — a mesma URL que vira o QR Code impresso e colado na frente dela.
 */
export function buildColetaUrl(qrToken: string): string {
  return `${siteConfig.url}/coletar/${qrToken}`;
}

/**
 * Gera o QR Code de coleta de uma baia já como PNG em data URI (base64),
 * pronto pra usar direto num <img src="...">. Roda só no servidor (usada em
 * Server Components) — sem depender de canvas no navegador, então funciona
 * igual em qualquer tela e também fica ótimo pra imprimir.
 */
export async function generateColetaQrDataUrl(qrToken: string, size = 240): Promise<string> {
  const url = buildColetaUrl(qrToken);
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: "#221b15", light: "#ffffff" },
  });
}

/**
 * Link do "lançamento mestre" — tela que lista todas as baias ativas de uma
 * vez pra lançar a coleta do dia inteiro numa confirmação só, em vez de
 * abrir baia por baia. Ao contrário do QR Code por baia (buildColetaUrl),
 * esse link não depende de nenhum token: é sempre o mesmo endereço fixo,
 * protegido pelo mesmo login (ver /coletar/mestre/page.tsx).
 */
export function buildMestreUrl(): string {
  return `${siteConfig.url}/coletar/mestre`;
}

/** Gera o QR Code do lançamento mestre, já como PNG em data URI — mesmo
 * padrão do QR por baia (generateColetaQrDataUrl), só que sempre aponta pro
 * mesmo link fixo. */
export async function generateMestreQrDataUrl(size = 240): Promise<string> {
  return QRCode.toDataURL(buildMestreUrl(), {
    width: size,
    margin: 1,
    color: { dark: "#221b15", light: "#ffffff" },
  });
}
