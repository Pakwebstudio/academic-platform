"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { initials, getInitialsColor } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showInitials = !src || imgError;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0",
        sizes[size],
        showInitials ? getInitialsColor(name) : "",
        showInitials ? "text-white font-semibold" : "",
        className
      )}
    >
      {!src || imgError ? (
        initials(name)
      ) : (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
