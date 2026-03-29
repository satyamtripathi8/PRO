import React from "react";
import clsx from "clsx";

type CardVariant = "default" | "outlined" | "ghost";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
}

const baseStyles =
  "rounded-xl transition-all";

const variants: Record<CardVariant, string> = {
  default: "bg-white shadow-sm",
  outlined: "bg-white border border-gray-200",
  ghost: "bg-transparent",
};

const paddings: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        baseStyles,
        variants[variant],
        paddings[padding],
        hover && "hover:shadow-md cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}