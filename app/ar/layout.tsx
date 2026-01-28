// Minimal layout - providers only, no header/footer
// Site pages use (site) route group, print pages use (print) route group
export default function ArabicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
