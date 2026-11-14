/**
 * The Metabasis mark: an M whose left foot is an empty ring (where a post starts) and whose
 * right foot is a filled dot (where it lands). Keep in sync with app/icon.svg, which needs
 * literal colours because browsers load it on its own.
 */
export default function Logo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="64" height="64" rx="14" className="fill-accent" />
      <path
        d="M16 41V19l16 17 16-17v22"
        className="stroke-ink"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="47" r="4" className="stroke-ink" strokeWidth="2.5" />
      <circle cx="48" cy="47" r="5" className="fill-hl" />
    </svg>
  );
}
