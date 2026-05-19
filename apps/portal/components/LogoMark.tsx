/**
 * RevLooper logo mark — teal rounded-square with white looping-arrow ring.
 * The ring is a thick annulus split into two arc-pieces by diagonal cuts,
 * creating the "revolving loop" symbol.
 *
 * Props:
 *   size   – pixel size of the square icon (default 28)
 *   radius – corner radius of the background (default "22%" = same as SVG viewBox)
 */
export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label="RevLooper"
      className={className}
    >
      <rect width="100" height="100" rx="22" fill="#0d9488" />
      <defs>
        <mask id="rl-ring">
          <rect width="100" height="100" fill="black" />
          <circle cx="50" cy="50" r="36" fill="white" />
          <circle cx="50" cy="50" r="21" fill="black" />
        </mask>
        <clipPath id="rl-ca">
          <polygon points="67,8 100,0 100,100 28,92" />
        </clipPath>
        <clipPath id="rl-cb">
          <polygon points="0,0 72,8 33,92 0,100" />
        </clipPath>
      </defs>
      <rect width="100" height="100" fill="white" mask="url(#rl-ring)" clipPath="url(#rl-ca)" />
      <rect width="100" height="100" fill="white" mask="url(#rl-ring)" clipPath="url(#rl-cb)" />
    </svg>
  );
}
