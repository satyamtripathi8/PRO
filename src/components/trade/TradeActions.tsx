// import { useState } from "react";
// import Card from "../common/Card";
// import RangeSlider from "./RangeSlider";
// import TradingChart from "./TradingChart";
// import TradeActions from "./TradeActions";

// type TradeSide = "buy" | "sell" | null;

// export default function ChartCard({ stock }: any) {
//   const [tradeSide, setTradeSide] = useState<TradeSide>(null);
//   const [timeframe, setTimeframe] = useState("1D");

//   return (
//     <Card className="space-y-4">

//       {/* Header */}
//       <div>
//         <p className="text-sm text-gray-500">Logo {stock.name}</p>

//         <h2 className="text-xl font-semibold">
//           ₹ {stock.price}
//         </h2>

//         <p
//           className={`text-sm ${
//             stock.change >= 0 ? "text-green-600" : "text-red-500"
//           }`}
//         >
//           {stock.change >= 0 ? "+" : ""}
//           {stock.change} ({stock.percentage}%) {timeframe}
//         </p>
//       </div>

//       {/* Chart */}
//       <TradingChart symbol={stock.symbol} />

//       {/* Timeframes */}
//       <div className="flex justify-between text-xs text-gray-500">
//         {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "All"].map((t) => (
//           <button
//             key={t}
//             onClick={() => setTimeframe(t)}
//             className={`px-2 py-1 rounded ${
//               timeframe === t
//                 ? "text-blue-600 font-medium"
//                 : "hover:text-gray-800"
//             }`}
//           >
//             {t}
//           </button>
//         ))}
//       </div>

//       {/* Conditional UI */}
//       {!tradeSide ? (
//         <>
//           {/* About */}
//           <h3 className="font-semibold text-center">About</h3>

//           <div className="space-y-4">
//             <div>
//               <p className="text-xs text-gray-500">Today's Low</p>
//               <RangeSlider min={145.45} max={185.23} value={160} />
//             </div>

//             <div>
//               <p className="text-xs text-gray-500">52 Week Low</p>
//               <RangeSlider min={135.45} max={210.23} value={170} />
//             </div>
//           </div>

//           {/* Buttons */}
//           <div className="flex gap-3">
//             <button
//               onClick={() => setTradeSide("sell")}
//               className="flex-1 bg-red-500 text-white py-3 rounded"
//             >
//               Sell
//             </button>

//             <button
//               onClick={() => setTradeSide("buy")}
//               className="flex-1 bg-green-600 text-white py-3 rounded"
//             >
//               Buy
//             </button>
//           </div>
//         </>
//       ) : (
//         <TradeActions
//           side={tradeSide}
//           onClose={() => setTradeSide(null)}
//         />
//       )}

//     </Card>
//   );
// }

import { useState } from "react";
import { ordersApi } from "../../lib/api";

type TradeSide = "buy" | "sell";

interface TradeActionsProps {
  side: TradeSide;
  onClose: () => void;
  symbol?: string;
  currentPrice?: number;
}

export default function TradeActions({ side, onClose, symbol, currentPrice }: TradeActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(currentPrice || 150);
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const isBuy = side === "buy";
  const total = quantity * price;

  const handleSubmit = async () => {
    if (quantity <= 0 || price <= 0) {
      setMessage("Invalid quantity or price");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // Strip "NSE:" prefix for backend
      const cleanSymbol = (symbol || "UNKNOWN").replace("NSE:", "");
      await ordersApi.place({
        symbol: cleanSymbol,
        side: isBuy ? "BUY" : "SELL",
        orderType,
        quantity,
        entryPrice: price,
      });
      setMessage(`Order placed! ${isBuy ? "Bought" : "Sold"} ${quantity} × ₹${price}`);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setMessage(err.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isBuy ? "text-green-600" : "text-red-500"}`}>
          {isBuy ? "Buy Order" : "Sell Order"}
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-700">✕</button>
      </div>

      <div>
        <label className="text-sm text-gray-500">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-500">Price (₹)</label>
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setOrderType("MARKET")}
          className={`flex-1 py-2 border rounded-lg text-sm font-medium ${orderType === "MARKET" ? "bg-blue-50 border-blue-500 text-blue-600" : "hover:bg-gray-100"}`}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType("LIMIT")}
          className={`flex-1 py-2 border rounded-lg text-sm font-medium ${orderType === "LIMIT" ? "bg-blue-50 border-blue-500 text-blue-600" : "hover:bg-gray-100"}`}
        >
          Limit
        </button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
        <div className="flex justify-between"><span>Qty</span><span>{quantity}</span></div>
        <div className="flex justify-between"><span>Price</span><span>₹ {price}</span></div>
        <div className="flex justify-between font-semibold"><span>Total</span><span>₹ {total.toFixed(2)}</span></div>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("placed") ? "text-green-600" : "text-red-500"}`}>{message}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50 ${isBuy ? "bg-green-600" : "bg-red-500"}`}
      >
        {loading ? "Placing..." : isBuy ? "Confirm Buy" : "Confirm Sell"}
      </button>
    </div>
  );
}