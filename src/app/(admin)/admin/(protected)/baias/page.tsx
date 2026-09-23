import { getAllBaiasAdmin } from "@/lib/data/admin";
import { BaiasManager } from "@/components/admin/BaiasManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Baias" };

export default async function BaiasPage() {
  const baias = await getAllBaiasAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Baias</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Viveiros de criação: cadastre, registre posturas e anote observações.
      </p>
      <div className="mt-6">
        <BaiasManager baias={baias} />
      </div>
    </div>
  );
}
