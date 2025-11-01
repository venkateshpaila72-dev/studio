import type { SVGProps } from 'react';

export function NinjaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-accent"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.1" />
      <path d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 11.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" fill="url(#grad)" />
      <path d="M9.5 13c.83 0 1.5-.67 1.5-1.5S10.33 10 9.5 10s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm5 0c.83 0 1.5-.67 1.5-1.5S15.33 10 14.5 10s-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" className="text-primary" />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--foreground))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
