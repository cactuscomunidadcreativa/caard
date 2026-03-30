/**
 * CAARD - Page Hero con imagen de fondo editable desde CMS
 * ========================================================
 * Componente reutilizable para cabeceras de páginas públicas.
 * La imagen se configura desde el CMS (bgImage en la sección HERO).
 * Si no hay imagen, usa un gradiente por defecto.
 */

import Image from "next/image";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  bgImage?: string | null;
  /** Overlay opacity 0-100 (default 60) */
  overlayOpacity?: number;
  /** Height: "sm" | "md" | "lg" (default "md") */
  size?: "sm" | "md" | "lg";
  /** Alineación del texto */
  align?: "left" | "center";
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "py-16 md:py-20",
  md: "py-24 md:py-32",
  lg: "py-32 md:py-44",
};

export function PageHero({
  title,
  subtitle,
  bgImage,
  overlayOpacity = 60,
  size = "md",
  align = "center",
  children,
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden ${sizeClasses[size]}`}>
      {/* Background */}
      {bgImage ? (
        <>
          <Image
            src={bgImage}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0 bg-[#0B2A5B]"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A5B] via-[#0d3570] to-[#0B2A5B]">
          {/* Patrón decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#D66829] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#D66829] rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`relative z-10 container mx-auto px-4 ${align === "center" ? "text-center" : "text-left"}`}>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Versión editable para el admin CMS
 * Permite subir/cambiar la imagen de fondo
 */
interface EditablePageHeroProps extends PageHeroProps {
  pageSlug: string;
  onImageChange?: (url: string) => void;
}

export function EditablePageHero({
  title,
  subtitle,
  bgImage,
  pageSlug,
  onImageChange,
  ...props
}: EditablePageHeroProps) {
  return (
    <div className="relative group">
      <PageHero title={title} subtitle={subtitle} bgImage={bgImage} {...props} />

      {/* Overlay de edición (visible solo en hover) */}
      {onImageChange && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
          <label className="cursor-pointer bg-white rounded-lg px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Cambiar imagen de cabecera
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", `heroes/${pageSlug}`);

                try {
                  const res = await fetch("/api/cms/media/upload", {
                    method: "POST",
                    body: formData,
                  });
                  const data = await res.json();
                  if (data.url) {
                    onImageChange(data.url);
                  }
                } catch (err) {
                  console.error("Error uploading hero image:", err);
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
