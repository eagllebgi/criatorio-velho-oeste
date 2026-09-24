import { getAllBaiasAdmin } from "@/lib/data/admin";
import { BaiasManager } from "@/components/admin/BaiasManager";
import { generateColetaQrDataUrl } from "@/lib/qrcode";

export const dynamic = "force-dynamic";
export const metadata = { title: "Baias" };

export default async function BaiasPage() {
  const baias = await getAllBaiasAdmin();

  // QR Code de coleta de cada baia, já gerado aqui no servidor — o card só
  // exibe a imagem pronta, sem precisar de nenhuma geração no navegador.
  const qrEntries = await Promise.all(
    baias.map(async (baia) => [baia.id, await generateColetaQrDataUrl(baia.qrToken)] as const),
  );
  const qrDataUrls = Object.fromEntries(qrEntries);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Baias</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Viveiros de criação: cadastre, registre posturas e anote observações.
      </p>
      <div className="mt-6">
        <BaiasManager baias={baias} qrDataUrls={qrDataUrls} />
      </div>
    </div>
  );
}
