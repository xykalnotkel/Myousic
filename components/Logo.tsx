export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <rect width="64" height="64" rx="16" fill="#0a0a0a" />
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.2"
      />
      <path
        d="M18 44V28l10-14 8 11 10-16v35"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="44" r="5.2" fill="currentColor" />
      <circle cx="46" cy="44" r="2" fill="#0a0a0a" />
    </svg>
  );
}
