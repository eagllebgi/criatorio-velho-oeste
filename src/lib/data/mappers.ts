import type {
  AveRow,
  BaiaObservacaoRow,
  BaiaRow,
  CategoryRow,
  FinanceiroRow,
  LotePosturaRow,
  ProductRow,
} from "@/lib/types/database";
import type {
  Ave,
  Baia,
  BaiaObservacao,
  Category,
  Financeiro,
  LotePostura,
  Product,
} from "@/lib/types/domain";

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
    productType: row.product_type,
  };
}

// ── Gestão interna ──────────────────────────────────────────────────────

export function mapFinanceiro(row: FinanceiroRow): Financeiro {
  return {
    id: row.id,
    tipo: row.tipo,
    descricao: row.descricao,
    categoria: row.categoria,
    valor: row.valor,
    data: row.data,
    formaPagamento: row.forma_pagamento,
    createdAt: row.created_at,
  };
}

type BaiaRowWithRelations = BaiaRow & {
  aves: { sexo: Ave["sexo"]; status: Ave["status"] }[] | null;
};

export function mapBaia(row: BaiaRowWithRelations): Baia {
  // Aves com baixa dada (Vendido/Óbito) não contam mais como parte do
  // plantel ativo da baia — a baixa por anilha propaga pra cá automaticamente,
  // sem precisar desvincular a ave manualmente.
  const aves = (row.aves ?? []).filter((a) => a.status !== "Vendido" && a.status !== "Óbito");
  return {
    id: row.id,
    codigo: row.codigo,
    numero: row.numero,
    nome: row.nome,
    especie: row.especie,
    setor: row.setor,
    status: row.status,
    precoOvo: row.preco_ovo,
    destinoPadrao: row.destino_padrao,
    observacoes: row.observacoes,
    fotoUrl: row.foto_url,
    qrToken: row.qr_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalAves: aves.length,
    machos: aves.filter((a) => a.sexo === "Macho").length,
    femeas: aves.filter((a) => a.sexo === "Fêmea").length,
  };
}

export function mapBaiaObservacao(row: BaiaObservacaoRow): BaiaObservacao {
  return {
    id: row.id,
    baiaId: row.baia_id,
    texto: row.texto,
    createdAt: row.created_at,
  };
}

type AveRowWithRelations = AveRow & {
  baias: { nome: string } | null;
};

export function mapAve(row: AveRowWithRelations): Ave {
  return {
    id: row.id,
    codigo: row.codigo,
    baiaId: row.baia_id,
    baiaNome: row.baias?.nome ?? null,
    nome: row.nome,
    emoji: row.emoji,
    anilha: row.anilha,
    sexo: row.sexo,
    status: row.status,
    dataNascimento: row.data_nascimento,
    observacoes: row.observacoes,
    fotoUrl: row.foto_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type LotePosturaRowWithRelations = LotePosturaRow & {
  baias: { nome: string } | null;
};

export function mapLotePostura(row: LotePosturaRowWithRelations): LotePostura {
  return {
    id: row.id,
    codigo: row.codigo,
    baiaId: row.baia_id,
    baiaNome: row.baias?.nome ?? null,
    quantidade: row.quantidade,
    precoUnit: row.preco_unit,
    dataPostura: row.data_postura,
    destino: row.destino,
    status: row.status,
    eclosaoPrevista: row.eclosao_prevista,
    loteOrigemId: row.lote_origem_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
