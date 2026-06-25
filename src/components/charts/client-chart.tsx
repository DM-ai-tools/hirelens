"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Renders children only after mount so Recharts gets real container dimensions. */
export function ClientChart({
  children,
  className,
  minHeight = 240,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={className ?? "w-full min-w-0 animate-pulse rounded-xl bg-muted/40"}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={className ?? "w-full min-w-0"} style={{ minHeight }}>
      {children}
    </div>
  );
}
