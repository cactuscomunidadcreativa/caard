/**
 * Backdrop que renderiza la imagen de hero configurada en
 * /admin/cms/hero-images como capa absolute dentro de un <section> hero
 * ya existente, con overlay oscuro para mantener legibilidad del texto.
 *
 * Server component (es solo markup, sin estado): se puede usar dentro de
 * páginas async sin convertirlas a client component.
 */
export function CmsHeroBackdrop({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[#0B2A5B]/70" />
    </>
  );
}
