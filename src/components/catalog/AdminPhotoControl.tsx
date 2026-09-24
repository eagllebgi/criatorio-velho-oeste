"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildProductImagePath } from "@/lib/storage";
import { ImageCropModal } from "@/components/admin/ImageCropModal";

const BUCKET = "product-images";

/**
 * Botão flutuante pra trocar a foto principal do produto, que só aparece
 * pro administrador logado, direto nas páginas públicas do site (catálogo,
 * destaques da Home, página do produto). Um cliente comum nunca vê isso.
 *
 * Faz o mesmo que o "clique pra trocar a foto" já usado na tabela do painel
 * admin: envia o arquivo pro Storage, registra a foto extra em
 * product_images e atualiza products.main_image — tudo protegido pela
 * política de segurança do banco (RLS), que só permite isso pra quem está
 * autenticado.
 */
export function AdminPhotoControl({
  productId,
  onUploaded,
}: {
  productId: string;
  onUploaded?: (url: string) => void;
}) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPendingFile(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingFile(null);
    setUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const path = buildProductImagePath(productId, "foto.jpg");
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: false, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from("product_images")
        .insert({ product_id: productId, image_url: url, display_order: 0 });
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("products")
        .update({ main_image: url })
        .eq("id", productId);
      if (updateError) throw updateError;

      onUploaded?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <label
        title="Trocar a foto principal (só você vê este botão)"
        className="absolute bottom-2 right-2 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-brand-gold bg-white/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-brown-dark shadow-md backdrop-blur-sm hover:bg-white sm:bottom-3 sm:right-3"
      >
        {uploading ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Camera className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Trocar foto</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files);
            e.target.value = "";
          }}
        />
        {error && (
          <span className="absolute bottom-full right-0 z-10 mb-1 w-max max-w-[11rem] rounded-md bg-red-600 px-2 py-1 text-[0.65rem] font-normal normal-case text-white">
            {error}
          </span>
        )}
      </label>

      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          aspect={4 / 3}
          title="Ajustar foto principal"
          onCancel={() => setPendingFile(null)}
          onCropped={handleCropped}
        />
      )}
    </>
  );
}
