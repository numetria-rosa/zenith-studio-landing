"use client";

import { useId } from "react";

export function FlagUS({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="English">
      <clipPath id={id}>
        <rect width="24" height="16" rx="3" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="24" height="16" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((i) => (
          <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#B22234" />
        ))}
        <rect width="10.5" height={16 * (7 / 13)} fill="#3C3B6E" />
      </g>
    </svg>
  );
}

export function FlagES({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="Español">
      <clipPath id={id}>
        <rect width="24" height="16" rx="3" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="24" height="16" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
      </g>
    </svg>
  );
}

export function FlagFR({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="Français">
      <clipPath id={id}>
        <rect width="24" height="16" rx="3" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="24" height="16" fill="#fff" />
        <rect width="8" height="16" fill="#0055A4" />
        <rect x="16" width="8" height="16" fill="#EF4135" />
      </g>
    </svg>
  );
}

export function FlagSE({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="Svenska">
      <clipPath id={id}>
        <rect width="24" height="16" rx="3" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="24" height="16" fill="#006AA7" />
        <rect x="8" width="3" height="16" fill="#FECC00" />
        <rect y="6.5" width="24" height="3" fill="#FECC00" />
      </g>
    </svg>
  );
}
