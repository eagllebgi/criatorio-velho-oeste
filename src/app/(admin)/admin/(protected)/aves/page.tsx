import { getAllAvesAdmin, getAllBaiasAdmin } from "@/lib/data/admin";
import { AvesManager } from "@/components/admin/AvesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aves" };

export default async function AvesPage() {
  const [aves, baias] = await Promise.all([getAllAvesAdmin(), getAllBaiasAdmin()]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Plantel</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Controle individual das aves: reprodutoras, filhotes e disponíveis.
      </p>
      <div className="mt-6">
        <AvesManager aves={aves} baias={baias} />
      </div>
    </div>
  );
}
