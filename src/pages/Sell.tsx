import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { walletApi, ordersApi } from "../lib/api";
import { useMarketData } from "../hooks/useMarketData";

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export default function Sell() {
  const { symbol: paramSymbol } = useParams();
  const symbol = paramSymbol?.toUpperCase() || "";
  const navigate = useNavigate();
  const [holding, setHolding] = useState<any | null>(null);
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { quotes, lastUpdated, loading: quotesLoading, refetch } = useMarketData(symbol ? [symbol] : []);
  const quote = symbol ? quotes[symbol] : undefined;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await walletApi.getHoldings();
        const found = (res.data || []).find((h: any) => (h.symbol || '').toUpperCase() === symbol);
        if (!found) {
          setError('Holding not found');
          return;
        }
        setHolding(found);
        setQty(1);
        setPrice(found.avgPrice ? Number(found.avgPrice) : 0);
      } catch (e: any) {
        setError(e.message || 'Failed to load holding');
      }
    };
    if (symbol) load();
  }, [symbol]);

  useEffect(() => {
    if (quote?.price) {
      setPrice(quote.price);
    }
  }, [quote?.price]);

  const maxQty = useMemo(() => {
    return holding ? Number(holding.quantity) || 0 : 0;
  }, [holding]);

  const handleSell = async () => {
    if (!holding) {
      setError('Holding not found');
      return;
    }
    if (qty < 1 || qty > maxQty) {
      setError(`Quantity must be between 1 and ${maxQty}`);
      return;
    }

    // Determine execution price - fallback to avgPrice if market price unavailable
    const marketPrice = quote?.price ?? 0;
    const avgPrice = Number(holding.avgPrice) || 0;
    let execPrice = orderType === 'MARKET' ? (marketPrice > 0 ? marketPrice : avgPrice) : price;

    // Validate we have a valid price
    if (execPrice <= 0) {
      setError('Unable to determine execution price. Please try again.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      await ordersApi.place({
        symbol,
        side: 'SELL',
        orderType,
        quantity: qty,
        entryPrice: execPrice,
      });
      setMessage('✓ Sell order placed successfully');
      setTimeout(() => navigate('/Home/positions'), 800);
    } catch (e: any) {
      setError(e.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const currentValue = holding && quote ? quote.price * Number(holding.quantity) : 0;
  const investedValue = holding ? Number(holding.avgPrice || 0) * Number(holding?.quantity || 0) : 0;
  const pnl = currentValue - investedValue;
  const pnlPct = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

  // Use avgPrice as fallback when market price is 0
  const displayPrice = quote?.price && quote.price > 0 ? quote.price : (holding ? Number(holding.avgPrice) : 0);
  const priceUnavailable = !quote?.price || quote.price === 0;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <RefreshCw size={16} className={quotesLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <p className="text-sm text-gray-500">Selling</p>
              <h1 className="text-2xl font-bold text-gray-900">{symbol}</h1>
              {lastUpdated && (
                <p className="text-xs text-green-600 mt-1">Live · {lastUpdated.toLocaleTimeString('en-IN')}</p>
              )}
            </div>
            {quote && (
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {priceUnavailable ? 'Avg. Price (Live unavailable)' : 'Market Price'}
                </p>
                <p className="text-3xl font-bold text-gray-900">₹{fmt(displayPrice)}</p>
                {!priceUnavailable && (
                  <p className={`text-xs font-semibold ${quote.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {quote.change >= 0 ? '+' : ''}₹{fmt(quote.change)} ({quote.percentage >= 0 ? '+' : ''}{quote.percentage.toFixed(2)}%)
                  </p>
                )}
                {priceUnavailable && (
                  <p className="text-xs text-amber-600">Using purchase price for estimation</p>
                )}
              </div>
            )}
          </div>

          {holding ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs text-gray-500">Quantity Available</p>
                <p className="text-lg font-semibold text-gray-900">{holding.quantity}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs text-gray-500">Avg. Price</p>
                <p className="text-lg font-semibold text-gray-900">₹{fmt(Number(holding.avgPrice) || 0)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-xs text-gray-500">P&L</p>
                <p className={`text-lg font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {pnl >= 0 ? '+' : ''}₹{fmt(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm mb-6">
              {error || 'Loading holding...'}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-2">Order Type</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(['MARKET', 'LIMIT'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${orderType === type ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => setQty(Math.min(Math.max(1, Number(e.target.value)), maxQty))}
                    className="flex-1 px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                  />
                  <button
                    onClick={() => setQty(Math.min(maxQty, qty + 1))}
                    className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                    disabled={qty >= maxQty}
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Max available: {maxQty}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.05"
                    value={orderType === 'MARKET' ? displayPrice : price}
                    readOnly={orderType === 'MARKET'}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className={`w-full pl-7 pr-3 py-2.5 border rounded-lg outline-none font-semibold ${orderType === 'MARKET' ? 'bg-gray-50 text-gray-600' : 'focus:ring-2 focus:ring-blue-500'}`}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantity</span>
                <span className="text-sm font-semibold">{qty} shares</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Price per share</span>
                <span className="text-sm font-semibold">₹{fmt(orderType === 'MARKET' ? displayPrice : price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Type</span>
                <span className="text-sm font-semibold">{orderType}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-semibold">Total Value</span>
                <span className="text-xl font-bold">₹{fmt(qty * (orderType === 'MARKET' ? displayPrice : price))}</span>
              </div>
              {priceUnavailable && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Using average purchase price. Actual execution may vary.
                </p>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
              <button
                onClick={handleSell}
                disabled={loading || !holding || maxQty === 0}
                className="w-full py-3 rounded-xl text-white font-bold text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin" /> Processing...
                  </span>
                ) : (
                  'Place Sell Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
