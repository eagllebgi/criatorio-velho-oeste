import { getAllLotesPosturaAdmin } from "@/lib/data/admin";
import { PosturaManager } from "@/components/admin/PosturaManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Postura" };

export default async function PosturaPage() {
  const lotes = await getAllLotesPosturaAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-brand-ink">Postura</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Acompanhe os lotes de ovos: disponíveis, na chocadeira e o histórico.
      </p>
      <div className="mt-6">
        <PosturaManager lotes={lotes} />
      </div>
    </div>
  );
}
