import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../common/Card";
import clsx from "clsx";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Position } from "../../types/trading";

interface Props {
  pnl: number;
  positions: Position[];
  logos?: Record<string, string>;
}

// Company Logo component with fallback
function CompanyLogo({ symbol, logoUrl, size = 40 }: { symbol: string; logoUrl?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (!logoUrl || imgError) {
    return (
      <div
        className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-1"
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

export default function PositionCard({ pnl, positions, logos = {} }: Props) {
  const navigate = useNavigate();
  const [prevPnls, setPrevPnls] = useState<Record<string, number>>({});
  const [pnlDirections, setPnlDirections] = useState<Record<string, 'up' | 'down' | 'neutral'>>({});

  // Track individual position P&L changes
  useEffect(() => {
    const newDirections: Record<string, 'up' | 'down' | 'neutral'> = {};
    positions.forEach(pos => {
      const prev = prevPnls[pos.symbol] ?? pos.pnl;
      if (pos.pnl > prev) {
        newDirections[pos.symbol] = 'up';
      } else if (pos.pnl < prev) {
        newDirections[pos.symbol] = 'down';
      } else {
        newDirections[pos.symbol] = 'neutral';
      }
    });
    setPnlDirections(newDirections);
    setPrevPnls(Object.fromEntries(positions.map(p => [p.symbol, p.pnl])));

    // Reset after animation
    const timer = setTimeout(() => {
      setPnlDirections(Object.fromEntries(positions.map(p => [p.symbol, 'neutral'])));
    }, 800);
    return () => clearTimeout(timer);
  }, [positions.map(p => p.pnl).join(',')]);

  return (
    <Card className="p-0 overflow-hidden">

      {/* HEADER */}
      <div className={clsx(
        "text-center py-6 border-b relative overflow-hidden",
        pnl >= 0 ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-gradient-to-r from-red-50 to-rose-50"
      )}>
        <div className="absolute inset-0 opacity-5">
          {pnl >= 0 ? (
            <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-green-600" />
          ) : (
            <TrendingDown className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-red-600" />
          )}
        </div>
        <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
          Net P & L
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        </p>
        <p
          className={clsx(
            "text-2xl font-bold mt-1 flex items-center justify-center gap-2",
            pnl >= 0 ? "text-green-600" : "text-red-500"
          )}
        >
          {pnl >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          {pnl >= 0 ? "+" : ""}₹{fmt(Math.abs(pnl))}
        </p>
      </div>

      {/* LIST */}
      <div className="max-h-[400px] overflow-y-auto">
        {positions.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400">
            <p>No positions yet</p>
            <p className="text-sm mt-1">Start trading to see your holdings here</p>
          </div>
        ) : (
          positions.map((pos, i) => {
            const direction = pnlDirections[pos.symbol] || 'neutral';
            const pnlPercent = pos.avg > 0 ? ((pos.ltp - pos.avg) / pos.avg) * 100 : 0;
            const hasLiveData = pos.hasLiveData !== false;
            return (
              <div
                key={pos.id}
                className={clsx(
                  "px-5 py-4 transition-all duration-300",
                  i !== positions.length - 1 && "border-b",
                  direction === 'up' && "bg-green-50",
                  direction === 'down' && "bg-red-50"
                )}
              >
                {/* TOP ROW */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CompanyLogo symbol={pos.symbol} logoUrl={logos[pos.symbol]} size={36} />
                    <div>
                      <p className="font-semibold text-sm">{pos.symbol}</p>
                      <p className="text-xs text-gray-400">{pos.exchange}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!hasLiveData && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Est.
                      </span>
                    )}
                    <span className="bg-orange-100 text-orange-500 text-xs px-2 py-0.5 rounded font-medium">
                      {pos.product}
                    </span>
                  </div>
                </div>

                {/* MIDDLE: Stats */}
                <div className="flex justify-between mt-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-500">
                      <span className={pos.qty < 0 ? "text-red-500" : "text-green-600"}>
                        {pos.qty}
                      </span> shares
                    </p>
                    <p className="text-gray-500">
                      Avg. <span className="font-medium text-gray-700">₹{fmt(pos.avg)}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-gray-500">
                      LTP <span className={clsx(
                        "font-semibold",
                        direction === 'up' && "text-green-600",
                        direction === 'down' && "text-red-500",
                        direction === 'neutral' && "text-gray-700"
                      )}>₹{fmt(pos.ltp)}</span>
                    </p>
                    <p className={clsx(
                      "font-semibold flex items-center justify-end gap-1",
                      pos.pnl >= 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {pos.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {pos.pnl >= 0 ? "+" : ""}₹{fmt(Math.abs(pos.pnl))}
                      <span className={clsx(
                        "text-xs px-1.5 py-0.5 rounded-full ml-1",
                        pos.pnl >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      )}>
                        {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => navigate(`/Home/sell/${pos.symbol}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Sell
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}