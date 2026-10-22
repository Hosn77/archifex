import Link from "next/link";

interface BrandProps {
  href?: string;
  compact?: boolean;
}

export function Brand({ href = "/", compact = false }: BrandProps) {
  return (
    <Link className={`brand${compact ? " brand-compact" : ""}`} href={href} aria-label="Archifex — MadarFalak">
      <span className="brand-orbit" aria-hidden="true">
        <span className="brand-orbit-core" />
      </span>
      <span className="brand-copy">
        <span className="brand-product">Archifex</span>
        <span className="brand-subtitle">Document Archiving System</span>
        <span className="brand-powered">
          Powered by <strong>MadarFalak</strong>
        </span>
      </span>
    </Link>
  );
}
