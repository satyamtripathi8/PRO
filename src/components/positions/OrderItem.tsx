import { useState } from "react";
import clsx from "clsx";
import type { Order } from "../../types/trading";

interface Props {
  order: Order;
  logoUrl?: string;
}

// Company Logo component with fallback
function CompanyLogo({ symbol, logoUrl, size = 36 }: { symbol: string; logoUrl?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (!logoUrl || imgError) {
    return (
      <div
        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-1"
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt={symbol}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// Format number in Indian format
function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export default function OrderItem({ order, logoUrl }: Props) {
  const isBuy = order.type === "BUY";
  const totalValue = order.qty * order.avg;

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-none hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">

      {/* LOGO */}
      <CompanyLogo symbol={order.symbol} logoUrl={logoUrl} size={40} />

      {/* LEFT */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{order.symbol}</p>
          <span className={clsx(
            "text-xs px-2 py-0.5 rounded font-medium",
            isBuy ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          )}>
            {order.type}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{order.time} · Delivery</p>
      </div>

      {/* RIGHT */}
      <div className="text-right">
        <p className="text-sm font-semibold">₹{fmt(totalValue)}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
          <span
            className={clsx(
              "w-1.5 h-1.5 rounded-full",
              isBuy ? "bg-green-500" : "bg-red-500"
            )}
          />
          {order.qty} @ ₹{fmt(order.avg)}
        </p>
      </div>
    </div>
  );
}