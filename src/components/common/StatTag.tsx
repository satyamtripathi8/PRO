import clsx from "clsx";

type Variant = "default" | "soft" | "solid";

interface StatTagProps {
  value: number;          // e.g. 3.82
  percentage?: number;    // e.g. 2.4
  showSign?: boolean;     // + / -
  variant?: Variant;      // style variation
  className?: string;
}

export function StatTag({
  value,
  percentage,
  showSign = true,
  variant = "soft",
  className,
}: StatTagProps) {
  const isPositive = value >= 0;

  const formattedValue = `${showSign && isPositive ? "+" : ""}${value.toFixed(2)}`;
  const formattedPercentage =
    percentage !== undefined
      ? ` (${showSign && isPositive ? "+" : ""}${percentage.toFixed(2)}%)`
      : "";

  const variants: Record<Variant, string> = {
    soft: isPositive
      ? "bg-green-100 text-green-600"
      : "bg-red-100 text-red-500",
    solid: isPositive
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white",
    default: isPositive
      ? "text-green-600"
      : "text-red-500",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center text-sm font-medium px-2 py-1 rounded",
        variants[variant],
        className
      )}
    >
      {formattedValue}
      {formattedPercentage}
    </span>
  );
}