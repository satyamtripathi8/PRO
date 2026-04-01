import { useState, useEffect } from 'react';
import { RefreshCw, X, ShoppingCart } from 'lucide-react';
import { ordersApi } from '../../lib/api';
import { showToastGlobal } from '../../hooks/useToast';

interface FloatingTradePanelProps {
  symbol: string;
  currentPrice: number;
  isIndex: boolean;
  onNavigateOptions?: () => void;
}

export default function FloatingTradePanel({
  symbol,
  currentPrice,
  isIndex,
  onNavigateOptions,
}: FloatingTradePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reset when symbol changes
  useEffect(() => {
    setQty(1);
    setSide('BUY');
  }, [symbol]);

  const handleTrade = async () => {
    if (qty < 1 || currentPrice <= 0) return;
    setLoading(true);
    try {
      await ordersApi.place({
        symbol: symbol.replace(/^(NSE:|BSE:)/, ''),
        side,
        orderType: 'MARKET',
        quantity: qty,
        entryPrice: currentPrice,
      });
      showToastGlobal(`${side} ${qty} ${symbol} @ ₹${currentPrice.toFixed(2)}`, 'success');
      setExpanded(false);
      setQty(1);
    } catch (e: any) {
      showToastGlobal(e.message || 'Order failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = qty * currentPrice;

  // For indices, show "Trade Options" button
  if (isIndex) {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-40">
        <button
          onClick={onNavigateOptions}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold text-sm"
        >
          <ShoppingCart size={18} />
          Trade Options
        </button>
      </div>
    );
  }

  // Collapsed FAB
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm active:scale-95"
        >
          <ShoppingCart size={18} />
          Trade
        </button>
      </div>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-40 w-auto sm:w-[300px]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between ${
          side === 'BUY'
            ? 'bg-gradient-to-r from-green-500 to-green-600'
            : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <div className="text-white">
            <p className="font-bold text-sm">{symbol}</p>
            <p className="text-xs text-white/80">₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="text-white/80 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {/* Buy/Sell Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                side === 'BUY' ? 'bg-green-500 text-white shadow' : 'text-gray-600'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                side === 'SELL' ? 'bg-red-500 text-white shadow' : 'text-gray-600'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-1.5">Quantity</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, +e.target.value))}
                className="flex-1 text-center py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 border rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className={`rounded-lg p-3 mb-4 ${side === 'BUY' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Total Value</span>
              <span className="font-bold text-gray-900">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleTrade}
            disabled={loading || qty < 1}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.98] ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Processing...
              </span>
            ) : (
              `${side} ${qty} ${qty === 1 ? 'Share' : 'Shares'}`
            )}
          </button>

          <p className="text-[10px] text-center text-gray-400 mt-2">Paper Trading • No real money</p>
        </div>
      </div>
    </div>
  );
}
