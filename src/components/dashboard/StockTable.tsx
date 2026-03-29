import Card from "../common/Card";
import clsx from "clsx";

export type Stock = {
  id: string | number;
  symbol: string;       // TSLA
  name?: string;        // Tesla Inc.
  price: number;        // 245
  change: number;       // +5.2
  percentage: number;   // +2.4
};

interface StockTableProps {
  title: string;
  data: Stock[];
  onViewAll?: () => void;
  className?: string;
}

export default function StockTable({
  title,
  data,
  onViewAll,
  className,
}: StockTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <Card className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-500 hover:underline"
          >
            View All
          </button>
        )}
      </div>

      {/* Table */}
      <div className="space-y-3">
        {data.map((stock, index) => {
          const isPositive = stock.change >= 0;

          return (
            <div
              key={stock.id}
              className={clsx(
                "flex justify-between items-center py-2",
                index !== data.length - 1 && "border-b"
              )}
            >
              {/* Left - Symbol + Name */}
              <div>
                <p className="font-medium">{stock.symbol}</p>
                {stock.name && (
                  <p className="text-xs text-gray-400">
                    {stock.name}
                  </p>
                )}
              </div>

              {/* Middle - Price */}
              <p className="text-sm font-medium">
                {formatCurrency(stock.price)}
              </p>

              {/* Right - Change */}
              <div
                className={clsx(
                  "text-sm font-medium",
                  isPositive ? "text-green-600" : "text-red-500"
                )}
              >
                {isPositive ? "+" : ""}
                {stock.change.toFixed(2)} (
                {isPositive ? "+" : ""}
                {stock.percentage.toFixed(2)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          No data available
        </p>
      )}
    </Card>
  );
}