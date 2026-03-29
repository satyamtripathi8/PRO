import Card from "../common/Card";
import { StatTag } from "../common/StatTag";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";

interface PortfolioCardProps {
  title?: string;
  invested: number;
  current: number;
  className?: string;
}

export default function PortfolioCard({
  title = "Quick Portfolio",
  invested,
  current,
  className,
}: PortfolioCardProps) {
  const navigate = useNavigate();
  const pnl = current - invested;
  const percentage = (pnl / invested) * 100;

  const isPositive = pnl >= 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const handleClick = () => {
    navigate('/positions');
  };

  return (
    <Card 
      className={clsx("space-y-4 cursor-pointer hover:shadow-md transition-shadow", className)}
      onClick={handleClick}
    >
      {/* Header */}
      <h2 className="font-semibold text-base">{title}</h2>

      {/* Profit / Loss */}
      <div className="flex items-center gap-3">
        <p
          className={clsx(
            "text-lg font-semibold",
            isPositive ? "text-green-600" : "text-red-500"
          )}
        >
          {formatCurrency(pnl)}
        </p>

        <StatTag value={pnl} percentage={percentage} />
      </div>

      {/* Values */}
      <div className="flex justify-between text-sm text-gray-500">
        <div>
          <p className="text-xs text-gray-400">Invested</p>
          <p>{formatCurrency(invested)}</p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-400">Current</p>
          <p>{formatCurrency(current)}</p>
        </div>
      </div>
    </Card>
  );
}