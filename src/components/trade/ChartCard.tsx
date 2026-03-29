import { useState } from "react";
import Card from "../common/Card";
import RangeSlider from "./RangeSlider";
import TradingChart from "./TradingChart";
import TradeActions from "./TradeActions";

type TradeSide = "buy" | "sell" | null;

export default function ChartCard({ stock }: any) {
  const [tradeSide, setTradeSide] = useState<TradeSide>(null);
  const [timeframe, setTimeframe] = useState("1D");

  // ✅ Fix symbol
  const symbol = stock.symbol?.startsWith("NSE:")
    ? stock.symbol
    : `NSE:${stock.symbol}`;

  return (
    <Card className="flex flex-col h-full">

      {/* ============================== */}
      {/* 🔹 Scrollable Content */}
      {/* ============================== */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">

        {/* Header */}
        <div>
          <p className="text-sm text-gray-500">{stock.name}</p>

          <h2 className="text-2xl font-semibold">
            ₹ {stock.price}
          </h2>

          <p
            className={`text-sm ${
              stock.change >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {stock.change >= 0 ? "+" : ""}
            {stock.change} ({stock.percentage}%) {timeframe}
          </p>
        </div>

        {/* Chart */}
        <TradingChart symbol={symbol} />

        {/* Timeframes */}
        <div className="flex justify-between text-xs text-gray-500">
          {["1D", "1W", "1M", "3M", "6M", "1Y"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg transition ${
                timeframe === t
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:text-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* About Section */}
        {!tradeSide && (
          <div>
            <h3 className="font-semibold text-center mb-3">About</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Today's Range
                </p>
                <RangeSlider min={100} max={200} value={150} />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  52 Week Range
                </p>
                <RangeSlider min={90} max={250} value={170} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* 🔥 Bottom Section (Switches UI) */}
      {/* ============================== */}
      <div className="border-t bg-white p-3">

        {!tradeSide ? (
          // 👉 Default Buttons
          <div className="flex gap-3">
            <button
              onClick={() => setTradeSide("sell")}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition"
            >
              Sell
            </button>

            <button
              onClick={() => setTradeSide("buy")}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Buy
            </button>
          </div>
        ) : (
          // 👉 Trade Panel (Replaces buttons)
          <div className="animate-fadeIn">
            <TradeActions
              side={tradeSide}
              onClose={() => setTradeSide(null)}
              symbol={stock.symbol}
              currentPrice={stock.price}
            />
          </div>
        )}

      </div>
    </Card>
  );
}