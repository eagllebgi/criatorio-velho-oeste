import Image from "next/image";

const photos = [
  { src: "/gallery/matrizes.jpg", label: "Matrizes" },
  { src: "/gallery/aves.jpg", label: "Aves" },
  { src: "/gallery/instalacoes.jpg", label: "Instalações" },
  { src: "/gallery/marrecos.jpg", label: "Marrecos" },
  { src: "/gallery/criatorio.jpg", label: "Criatório" },
  { src: "/gallery/manejo.jpg", label: "Manejo" },
];

/**
 * Galeria com fotos reais do criatório (public/gallery/*.jpg). Para trocar
 * ou adicionar fotos, substitua os arquivos correspondentes ou ajuste a
 * lista `photos` acima.
 */
export function Gallery() {
  return (
    <section className="container-site py-20">
      <div className="mb-12 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Galeria
        </span>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-ink sm:text-4xl">
          Um pouco do nosso criatório
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.label}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-brand-sand/70"
          >
            <Image
              src={photo.src}
              alt={photo.label}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 640px) 33vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-xs font-medium uppercase tracking-wide text-white">
                {photo.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
