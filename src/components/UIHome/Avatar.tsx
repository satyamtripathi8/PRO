import { useState } from "react";
import clsx from "clsx";

// ============================
// TYPES
// ============================

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  rounded?: boolean;
  status?: "online" | "offline" | "busy";
}

// ============================
// SIZE CONFIG
// ============================

const sizeMap: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-lg",
};

const statusMap = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  busy: "bg-red-500",
};

// ============================
// HELPER
// ============================

function getInitials(name?: string) {
  if (!name) return "U";

  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

// ============================
// COMPONENT
// ============================

export default function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
  rounded = true,
  status,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showFallback = !src || imgError;
  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center bg-gray-200 text-gray-700 font-medium overflow-hidden",
        sizeMap[size],
        rounded ? "rounded-full" : "rounded-lg",
        className
      )}
    >
      {/* IMAGE */}
      {!showFallback && (
        <img
          src={src}
          alt={alt || name || "avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}

      {/* FALLBACK */}
      {showFallback && (
        <span aria-label={name}>{initials}</span>
      )}

      {/* STATUS DOT */}
      {status && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
            size === "xs" && "w-1.5 h-1.5",
            size === "sm" && "w-2 h-2",
            size === "md" && "w-2.5 h-2.5",
            size === "lg" && "w-3 h-3",
            size === "xl" && "w-3.5 h-3.5",
            statusMap[status]
          )}
        />
      )}
    </div>
  );
}