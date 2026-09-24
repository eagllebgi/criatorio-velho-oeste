/**
 * Tipos do banco de dados Supabase (schema public).
 * Mantenha em sincronia com supabase/migrations/0001_init.sql.
 *
 * Para gerar automaticamente a partir do projeto Supabase real, use:
 *   npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          display_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          display_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category_id: string | null;
          short_description: string | null;
          description: string | null;
          price: number | null;
          stock: number;
          low_stock_threshold: number;
          main_image: string | null;
          active: boolean;
          featured: boolean;
          display_order: number;
          product_type: "ovo" | "ave";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category_id?: string | null;
          short_description?: string | null;
          description?: string | null;
          price?: number | null;
          stock?: number;
          low_stock_threshold?: number;
          main_image?: string | null;
          active?: boolean;
          featured?: boolean;
          display_order?: number;
          product_type?: "ovo" | "ave";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          display_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      financeiro: {
        Row: {
          id: string;
          tipo: "entrada" | "saida";
          descricao: string;
          categoria: string | null;
          valor: number;
          data: string;
          forma_pagamento: "pix" | "dinheiro" | "cartao" | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: "entrada" | "saida";
          descricao: string;
          categoria?: string | null;
          valor: number;
          data?: string;
          forma_pagamento?: "pix" | "dinheiro" | "cartao" | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["financeiro"]["Insert"]>;
        Relationships: [];
      };
      baias: {
        Row: {
          id: string;
          codigo: string;
          numero: string;
          nome: string;
          especie: string;
          setor: string | null;
          status: "Reprodução" | "Ativa" | "Inativa";
          preco_ovo: number | null;
          destino_padrao: "venda" | "choc" | "reservado" | "descarte";
          observacoes: string | null;
          foto_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          numero: string;
          nome: string;
          especie: string;
          setor?: string | null;
          status?: "Reprodução" | "Ativa" | "Inativa";
          preco_ovo?: number | null;
          destino_padrao?: "venda" | "choc" | "reservado" | "descarte";
          observacoes?: string | null;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["baias"]["Insert"]>;
        Relationships: [];
      };
      baia_observacoes: {
        Row: {
          id: string;
          baia_id: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          baia_id: string;
          texto: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["baia_observacoes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "baia_observacoes_baia_id_fkey";
            columns: ["baia_id"];
            isOneToOne: false;
            referencedRelation: "baias";
            referencedColumns: ["id"];
          },
        ];
      };
      aves: {
        Row: {
          id: string;
          codigo: string;
          baia_id: string | null;
          nome: string;
          emoji: string;
          sexo: "Macho" | "Fêmea" | "Casal" | "Indefinido";
          status:
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
          anilha: string | null;
          data_nascimento: string | null;
          observacoes: string | null;
          foto_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          baia_id?: string | null;
          nome: string;
          emoji?: string;
          sexo?: "Macho" | "Fêmea" | "Casal" | "Indefinido";
          status?:
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
          anilha?: string | null;
          data_nascimento?: string | null;
          observacoes?: string | null;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["aves"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "aves_baia_id_fkey";
            columns: ["baia_id"];
            isOneToOne: false;
            referencedRelation: "baias";
            referencedColumns: ["id"];
          },
        ];
      };
      lotes_postura: {
        Row: {
          id: string;
          codigo: string;
          baia_id: string;
          quantidade: number;
          preco_unit: number | null;
          data_postura: string;
          destino: "venda" | "choc" | "reservado" | "descarte";
          status: "Disponível" | "Incubando" | "Reservado" | "Vendido" | "Concluído" | "Descartado";
          eclosao_prevista: string | null;
          lote_origem_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          baia_id: string;
          quantidade: number;
          preco_unit?: number | null;
          data_postura?: string;
          destino?: "venda" | "choc" | "reservado" | "descarte";
          status?: "Disponível" | "Incubando" | "Reservado" | "Vendido" | "Concluído" | "Descartado";
          eclosao_prevista?: string | null;
          lote_origem_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lotes_postura"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lotes_postura_baia_id_fkey";
            columns: ["baia_id"];
            isOneToOne: false;
            referencedRelation: "baias";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow =
  Database["public"]["Tables"]["product_images"]["Row"];
export type FinanceiroRow = Database["public"]["Tables"]["financeiro"]["Row"];
export type BaiaRow = Database["public"]["Tables"]["baias"]["Row"];
export type BaiaObservacaoRow =
  Database["public"]["Tables"]["baia_observacoes"]["Row"];
export type AveRow = Database["public"]["Tables"]["aves"]["Row"];
export type LotePosturaRow =
  Database["public"]["Tables"]["lotes_postura"]["Row"];
