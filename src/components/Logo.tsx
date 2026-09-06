import Link from "next/link";

/** Geometric peg + bank mark — UK fishery peg, not fish-in-a-box. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" fill="#0D4F3C" />
      <path d="M0 26 L18 18 L40 24 V40 H0 Z" fill="#0A3F30" />
      <path d="M0 28 H40 V40 H0 Z" fill="#0B3A2E" />
      <path d="M4 31.5 H36" stroke="#D7E6E0" strokeWidth="1.2" strokeLinecap="square" opacity="0.55" />
      <path d="M8 35 H32" stroke="#D7E6E0" strokeWidth="1.2" strokeLinecap="square" opacity="0.35" />
      <path d="M20 8 V28" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="square" />
      <path d="M20 8 L26 14 H14 Z" fill="#D94E1F" />
    </svg>
  );
}

/**
 * Distinctive SVG wordmark lockup: condensed geometric lettering + brand peg underline.
 * Not default UI text — authored as an SVG asset with tracking and signal tick.
 */
export function Wordmark({ className = "h-5 w-auto text-ink" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 22"
      className={className}
      role="img"
      aria-label="Bankside"
      focusable="false"
    >
      <text
        x="0"
        y="15"
        fill="currentColor"
        style={{
          fontFamily: 'var(--font-plex), "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-0.035em",
        }}
      >
        Bankside
      </text>
      <path d="M0 20 H120" stroke="#0D4F3C" strokeWidth="1.5" />
      <path d="M114 20 L122 20 L118 16.5 Z" fill="#D94E1F" />
    </svg>
  );
}

export function BanksideLogo({
  href,
  markSize = 28,
  showWordmark = true,
}: {
  href: string;
  markSize?: number;
  showWordmark?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="Bankside home">
      <Mark size={markSize} />
      {showWordmark ? <Wordmark className="h-[18px] w-auto text-ink max-[360px]:hidden" /> : null}
    </Link>
  );
}
