/**
 * CAARD - Layout para páginas públicas
 * Sin autenticación requerida
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
