import React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  return (
    <svg
      className={cn("block", className)}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id="tfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`hsl(var(--brand))`} />
          <stop offset="100%" stopColor={`hsl(var(--brand-2))`} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#tfGradient)" />
      <g fill="none" stroke="hsl(var(--background))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 22h9" />
        <path d="M24 16v16" />
        <path d="M28 30l6-6-6-6" />
      </g>
    </svg>
  );
};

export default Logo;
