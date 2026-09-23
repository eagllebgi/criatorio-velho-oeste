export function buildProductImagePath(productId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${productId}/${Date.now()}-${safeName}`;
}

/** Mesmo bucket de produtos ("product-images"), reaproveitado com um prefixo
 * de caminho próprio — as políticas de RLS do bucket não restringem por
 * caminho, então isso funciona sem precisar de uma policy nova. */
export function buildAveImagePath(aveId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `aves/${aveId}/${Date.now()}-${safeName}`;
}

export function buildBaiaImagePath(baiaId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `baias/${baiaId}/${Date.now()}-${safeName}`;
}
