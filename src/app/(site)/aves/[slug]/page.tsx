import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug } from "@/lib/data/products";
import { formatBRL } from "@/lib/utils";
import { StockBadge } from "@/components/catalog/StockBadge";
import { AdminStockControl } from "@/components/catalog/AdminStockControl";
import { AdminPriceControl } from "@/components/catalog/AdminPriceControl";
import { ProductDetailPurchase } from "@/components/catalog/ProductDetailPurchase";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { siteConfig } from "@/lib/config/site";
import { getAdminUser } from "@/lib/supabase/server";

export async function generateMetadata(
  props: PageProps<"/aves/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug, "ave");
  if (!product || product.productType !== "ave") return {};

  const title = `${product.name} — Ave Viva`;
  const description =
    product.shortDescription ??
    `Ave viva de ${product.name}, disponível no ${siteConfig.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.mainImage ? [product.mainImage] : undefined,
    },
  };
}

export default async function AvePage(props: PageProps<"/aves/[slug]">) {
  const { slug } = await props.params;
  const [product, adminUser] = await Promise.all([
    getProductBySlug(slug, "ave"),
    getAdminUser(),
  ]);

  if (!product || product.productType !== "ave") notFound();
  const isAdmin = Boolean(adminUser);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.mainImage ?? undefined,
    category: product.categoryName ?? undefined,
    offers:
      product.price !== null
        ? {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: product.price,
            availability:
              product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          }
        : undefined,
  };

  return (
    <div className="container-site py-14">
      <nav className="mb-8 flex items-center gap-1.5 text-xs text-brand-ink/50" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-ink">
          Início
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href="/aves" className="hover:text-brand-ink">
          Aves Vivas
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-brand-ink/80">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images}
          alt={product.name}
          productId={product.id}
          isAdmin={isAdmin}
        />

        <div className="flex flex-col gap-4">
          {product.categoryName && (
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-brown/70">
              {product.categoryName}
            </span>
          )}
          <h1 className="font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
            {product.name}
          </h1>
          <StockBadge stock={product.stock} lowStockThreshold={product.lowStockThreshold} />

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-brand-green">
              {formatBRL(product.price)}
            </span>
            {product.price !== null && (
              <span className="text-sm text-brand-ink/50">/ ave</span>
            )}
          </div>

          {isAdmin && <AdminPriceControl productId={product.id} price={product.price} />}
          {isAdmin && <AdminStockControl productId={product.id} stock={product.stock} />}

          {(product.description || product.shortDescription) && (
            <p className="text-sm leading-relaxed text-brand-ink/70 sm:text-base">
              {product.description ?? product.shortDescription}
            </p>
          )}

          <div className="mt-4">
            <ProductDetailPurchase product={product} />
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
