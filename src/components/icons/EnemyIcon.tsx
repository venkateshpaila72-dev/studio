import type { SVGProps } from 'react';

export function EnemyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]"
      {...props}
    >
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" opacity="0.4" />
      <path d="M15.5 9.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM8.5 9.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
      <path d="M12 14c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" />
    </svg>
  );
}
