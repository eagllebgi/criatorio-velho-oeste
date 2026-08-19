import type { CategoryRow, ProductRow } from "@/lib/types/database";
import type { Category, Product } from "@/lib/types/domain";

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    displayOrder: row.display_order,
    active: row.active,
  };
}

type ProductRowWithRelations = ProductRow & {
  categories: { name: string; slug: string } | null;
  product_images: { image_url: string; display_order: number }[] | null;
};

export function mapProduct(row: ProductRowWithRelations): Product {
  const extraImages = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => img.image_url);

  const images = row.main_image
    ? [row.main_image, ...extraImages.filter((url) => url !== row.main_image)]
    : extraImages;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    categorySlug: row.categories?.slug ?? null,
    shortDescription: row.short_description,
    description: row.description,
    price: row.price,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    mainImage: row.main_image,
    images,
    active: row.active,
    featured: row.featured,
    displayOrder: row.display_order,
  };
}
