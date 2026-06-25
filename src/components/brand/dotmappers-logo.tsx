"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/dotmappers-logo.png";

export function DotMappersLogo({
  height = 38,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="DOTMappers"
      width={Math.round(height * 4.2)}
      height={height}
      className={cn("brand-logo-mark", className)}
      style={{ width: "auto", height }}
      priority={priority}
    />
  );
}
