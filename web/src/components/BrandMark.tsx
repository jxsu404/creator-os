import Link from "next/link";

/** Wordmark + mark de Ideazo (marca pública). */
export function BrandMark({
  href = "/",
  size = "sm",
  linked = true,
}: {
  href?: string;
  size?: "sm" | "lg";
  /** false en pantallas de auth donde no debe navegar */
  linked?: boolean;
}) {
  const className =
    size === "lg" ? "brand-lockup brand-lockup-lg" : "brand-lockup";

  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-192.png"
        alt=""
        width={size === "lg" ? 40 : 22}
        height={size === "lg" ? 40 : 22}
        className="brand-mark-icon"
      />
      <span className="brand-mark">Ideazo</span>
    </>
  );

  if (!linked) {
    return <span className={className}>{inner}</span>;
  }

  return (
    <Link href={href} className={className} aria-label="Ideazo — inicio">
      {inner}
    </Link>
  );
}
