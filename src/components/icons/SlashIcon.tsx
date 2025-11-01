import type { SVGProps } from 'react';

export function SlashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent/80 drop-shadow-[0_0_8px_hsl(var(--accent))]"
      {...props}
    >
      <path d="M22 2 L2 22" />
    </svg>
  );
}
