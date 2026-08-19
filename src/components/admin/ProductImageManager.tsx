"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Star, Trash2, Upload, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildProductImagePath } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface ImageItem {
  id: string;
  url: string;
}

const BUCKET = "product-images";

export function ProductImageManager({
  productId,
  mainImage,
  initialImages,
}: {
  productId: string;
  mainImage: string | null;
  initialImages: ImageItem[];
}) {
  const supabase = createClient();
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [main, setMain] = useState<string | null>(mainImage);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const path = buildProductImagePath(productId, file.name);
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const url = publicUrlData.publicUrl;

        const { data: inserted, error: insertError } = await supabase
          .from("product_images")
          .insert({ product_id: productId, image_url: url, display_order: images.length })
          .select("id, image_url")
          .single();

        if (insertError) throw insertError;

        setImages((prev) => [...prev, { id: inserted.id, url: inserted.image_url }]);

        if (!main) {
          await supabase.from("products").update({ main_image: url }).eq("id", productId);
          setMain(url);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetMain(url: string) {
    setError(null);
    const { error: updateError } = await supabase
      .from("products")
      .update({ main_image: url })
      .eq("id", productId);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMain(url);
  }

  async function handleDelete(image: ImageItem) {
    if (!window.confirm("Remover esta imagem?")) return;
    setError(null);

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setImages((prev) => prev.filter((img) => img.id !== image.id));

    if (main === image.url) {
      const fallback = images.find((img) => img.id !== image.id)?.url ?? null;
      await supabase.from("products").update({ main_image: fallback }).eq("id", productId);
      setMain(fallback);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border-2",
              main === image.url ? "border-brand-gold" : "border-transparent",
            )}
          >
            <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleSetMain(image.url)}
                title="Definir como imagem principal"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-brand-brown hover:bg-white"
              >
                <Star className={cn("h-3.5 w-3.5", main === image.url && "fill-brand-gold text-brand-gold")} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(image)}
                title="Excluir imagem"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            {main === image.url && (
              <span className="absolute left-2 top-2 rounded-full bg-brand-gold px-2 py-0.5 text-[0.65rem] font-medium text-brand-ink">
                Principal
              </span>
            )}
          </div>
        ))}

        <label
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-sand text-brand-ink/50 hover:border-brand-green/50 hover:text-brand-green",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-6 w-6" aria-hidden="true" />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Enviando..." : "Adicionar foto"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
