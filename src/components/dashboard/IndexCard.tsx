import Card from "../common/Card";
import { StatTag } from "../common/StatTag";
import clsx from "clsx";

interface IndexCardProps {
  name: string;        // e.g. "NIFTY 50"
  price: number;       // e.g. 158.34
  change: number;      // e.g. 3.82
  percentage?: number; // e.g. 2.4
  className?: string;
}

export default function IndexCard({
  name,
  price,
  change,
  percentage,
  className,
}: IndexCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <Card className={clsx("space-y-2", className)}>
      {/* Index Name */}
      <p className="text-sm text-gray-500 font-medium">{name}</p>

      {/* Price + Change */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {formatCurrency(price)}
        </h3>

        <StatTag value={change} percentage={percentage} />
      </div>
    </Card>
  );
}