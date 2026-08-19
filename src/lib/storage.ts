export function buildProductImagePath(productId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${productId}/${Date.now()}-${safeName}`;
}
