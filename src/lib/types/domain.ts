export interface StockStatus {
  level: "available" | "low" | "out";
  label: string;
}

export type ProductType = "ovo" | "ave";

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number | null;
  stock: number;
  lowStockThreshold: number;
  mainImage: string | null;
  images: string[];
  active: boolean;
  featured: boolean;
  displayOrder: number;
  productType: ProductType;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

export function getStockStatus(product: {
  stock: number;
  lowStockThreshold: number;
}): StockStatus {
  if (product.stock <= 0) {
    return { level: "out", label: "Indisponível no momento" };
  }
  if (product.stock <= product.lowStockThreshold) {
    return { level: "low", label: "Últimas unidades" };
  }
  return { level: "available", label: "Disponível" };
}

// ── Gestão interna (financeiro, baias, aves, postura) ──────────────────────
// Estas entidades nunca aparecem no site público — uso exclusivo do admin.

export interface Financeiro {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  createdAt: string;
}

export type BaiaStatus = "Reprodução" | "Ativa" | "Inativa";
export type Destino = "venda" | "choc" | "reservado" | "descarte";

export interface Baia {
  id: string;
  codigo: string;
  numero: string;
  nome: string;
  especie: string;
  setor: string | null;
  status: BaiaStatus;
  precoOvo: number | null;
  destinoPadrao: Destino;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BaiaObservacao {
  id: string;
  baiaId: string;
  texto: string;
  createdAt: string;
}

export type AveSexo = "Macho" | "Fêmea" | "Casal" | "Indefinido";
export type AveStatus =
  | "Filhote"
  | "Disponível"
  | "Reprodutor"
  | "Macho reprodutor"
  | "Fêmea reprodutora"
  | "Matriz"
  | "Reservado"
  | "Vendido"
  | "Separado"
  | "Óbito";

export interface Ave {
  id: string;
  codigo: string;
  baiaId: string | null;
  baiaNome: string | null;
  nome: string;
  emoji: string;
  sexo: AveSexo;
  status: AveStatus;
  dataNascimento: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LotePosturaStatus =
  | "Disponível"
  | "Incubando"
  | "Reservado"
  | "Vendido"
  | "Concluído"
  | "Descartado";

export interface LotePostura {
  id: string;
  codigo: string;
  baiaId: string;
  baiaNome: string | null;
  quantidade: number;
  precoUnit: number | null;
  dataPostura: string;
  destino: Destino;
  status: LotePosturaStatus;
  eclosaoPrevista: string | null;
  loteOrigemId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Espécie ganha um emoji padrão, seguindo o mesmo mapeamento usado no
 * cadastro individual de aves — mantém a experiência simples e consistente. */
export function emojiForEspecie(especie: string): string {
  const nome = especie.toLowerCase();
  if (nome.includes("marreco") || nome.includes("pato")) return "🦆";
  if (nome.includes("pavão") || nome.includes("pavao")) return "🦚";
  if (nome.includes("ganso")) return "🦢";
  if (nome.includes("peru")) return "🦃";
  return "🐓";
}
