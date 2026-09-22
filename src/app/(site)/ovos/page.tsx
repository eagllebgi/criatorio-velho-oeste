import type { Metadata } from "next";
import { CatalogClient } from "@/components/catalog/CatalogClient";
import { EmptyState } from "@/components/catalog/EmptyState";
import { getActiveCategories, getActiveProducts } from "@/lib/data/products";
import { getAdminUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ovos Férteis",
  description:
    "Confira os ovos férteis disponíveis atualmente no Criatório Velho Oeste e monte seu pedido pelo WhatsApp.",
};

export default async function OvosPage() {
  const [products, categories, adminUser] = await Promise.all([
    getActiveProducts(),
    getActiveCategories(),
    getAdminUser(),
  ]);
  const isAdmin = Boolean(adminUser);

  return (
    <div className="container-site py-14">
      <div className="mb-10 max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
          Ovos Férteis Disponíveis
        </h1>
        <p className="mt-3 text-sm text-brand-ink/60 sm:text-base">
          A disponibilidade varia conforme a produção do criatório. Escolha
          as raças desejadas, informe as quantidades e finalize seu pedido
          pelo WhatsApp.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Novos ovos estarão disponíveis em breve"
          description="No momento não há ovos férteis cadastrados no catálogo. Fale com a gente para consultar a disponibilidade."
          showWhatsApp
        />
      ) : (
        <CatalogClient products={products} categories={categories} isAdmin={isAdmin} />
      )}
    </div>
  );
}
