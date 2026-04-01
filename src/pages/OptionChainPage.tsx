import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown, X, Wifi, WifiOff } from 'lucide-react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, ReferenceLine } from 'recharts';
import { marketApi, ordersApi } from '../lib/api';
import { WS_BASE_URL } from '../lib/config';
import ChartErrorBoundary from '../components/trade/ChartErrorBoundary';
import BackButton from '../components/common/BackButton';
import { showToastGlobal } from '../hooks/useToast';

const WS_URL = WS_BASE_URL;

// Format helpers
function fmt(n: number) {
  return n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '-';
}

function fmtCompact(n: number) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n?.toString() ?? '0';
}

const fmtPrice = (value: number) => (value && value > 0 ? value.toFixed(2) : '—');

interface OptionData {
  ltp: number;
  iv: number;
  oi: number;
  vol: number;
  change: number;
  delta?: number;
  theta?: number;
  bidPrice?: number;
  askPrice?: number;
}

interface Strike {
  strike: number;
  isATM: boolean;
  ce: OptionData;
  pe: OptionData;
}

interface OptionChainData {
  spotPrice: number;
  expiryDays: number;
  expiry: string;
  expiryDate?: string;
  strikes: Strike[];
  source?: string;
}

interface QuoteData {
  price: number;
  change: number;
  percentage: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
}

function OITooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const call = payload.find((p: any) => p.dataKey === 'callOI');
  const put = payload.find((p: any) => p.dataKey === 'putOI');
  return (
    <div className="bg-white shadow-lg border rounded-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">Strike: {label.toLocaleString('en-IN')}</p>
      <p className="text-green-600 mt-1">Call OI: {fmtCompact(call?.value || 0)}</p>
      <p className="text-red-500">Put OI: {fmtCompact(put?.value || 0)}</p>
    </div>
  );
}

// Trade Modal Component
function TradeModal({
  isOpen,
  onClose,
  type,
  strike,
  ltp,
  symbol,
  spotPrice,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'CE' | 'PE';
  strike: number;
  ltp: number;
  symbol: string;
  spotPrice: number;
  onSuccess: () => void;
}) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const lotSize = symbol.includes('BANKNIFTY') ? 15 : 50; // NIFTY lot = 50, BANKNIFTY lot = 15
  const totalQty = qty * lotSize;
  const totalValue = totalQty * ltp;
  const margin = totalValue * 0.15; // Approximate margin

  const handleTrade = async () => {
    setLoading(true);
    setMessage('');
    try {
      const optionSymbol = `${symbol}${strike}${type}`;
      await ordersApi.place({
        symbol: optionSymbol,
        side,
        orderType: 'MARKET',
        quantity: totalQty,
        entryPrice: ltp,
      });
      setMessage(`✓ ${side} order placed for ${optionSymbol}`);
      showToastGlobal(`${side} ${optionSymbol} x${totalQty} @ ₹${ltp.toFixed(2)}`, 'success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      setMessage(e.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:w-[420px] shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          type === 'CE' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <div>
            <h2 className="text-white font-bold text-lg">{symbol} {strike} {type}</h2>
            <p className="text-white/80 text-sm">
              Spot: ₹{fmt(spotPrice)} • LTP: ₹{fmt(ltp)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Buy/Sell Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                side === 'BUY' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                side === 'SELL' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="text-sm text-gray-500 block mb-2">Number of Lots (1 lot = {lotSize} qty)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-gray-50"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, +e.target.value))}
                className="flex-1 text-center text-2xl font-bold py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Total Quantity: {totalQty}</p>
          </div>

          {/* Summary */}
          <div className={`rounded-xl p-4 mb-6 ${side === 'BUY' ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Price per unit</span>
              <span className="font-semibold">₹{fmt(ltp)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Total Quantity</span>
              <span className="font-semibold">{totalQty}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Approx. Margin</span>
              <span className="font-semibold">₹{fmt(margin)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-semibold">Total Value</span>
              <span className="text-lg font-bold">₹{fmt(totalValue)}</span>
            </div>
          </div>

          {message && (
            <div className={`text-center py-2 px-4 rounded-lg mb-4 ${
              message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {message}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleTrade}
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin" />
                Processing...
              </span>
            ) : (
              `${side} ${qty} Lot${qty > 1 ? 's' : ''}`
            )}
          </button>

          <p className="text-xs text-center text-gray-400 mt-4">
            Paper Trading • No real money involved
          </p>
        </div>
      </div>
    </div>
  );
}

// Mini Candlestick Chart — with WS live tick injection
function MiniChart({ symbol, range }: { symbol: string; range: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const [isLive, setIsLive] = useState(false);

  // Inject live tick into current minute candle
  const injectTick = useCallback((price: number) => {
    if (!seriesRef.current || !lastCandleRef.current) return;
    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / 60) * 60;
    const prev = lastCandleRef.current;
    const updated = candleTime === prev.time
      ? { time: prev.time, open: prev.open, high: Math.max(prev.high, price), low: Math.min(prev.low, price), close: price }
      : { time: candleTime, open: price, high: price, low: price, close: price };
    lastCandleRef.current = updated;
    seriesRef.current.update(updated as any);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#666' },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: { vertLines: { color: '#f5f5f5' }, horzLines: { color: '#f5f5f5' } },
      rightPriceScale: { borderColor: '#e0e0e0' },
      timeScale: { borderColor: '#e0e0e0', timeVisible: true },
    });
    chartRef.current = chart;
    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    seriesRef.current = cs;

    marketApi.getHistory(symbol, range).then(res => {
      const candles = (res.data || []).map((c: any) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }));
      cs.setData(candles as any);
      chart.timeScale().fitContent();
      if (candles.length > 0) lastCandleRef.current = candles[candles.length - 1];
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [symbol, range]);

  // WS for live candle ticks
  useEffect(() => {
    mountedRef.current = true;
    if (range !== '1D') return;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => { ws.send(JSON.stringify({ type: 'subscribe', symbols: [symbol] })); setIsLive(true); };
      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'quote' && (msg.symbol === symbol || msg.data?.symbol === symbol)) {
            const price = msg.data?.price;
            if (price && price > 0) injectTick(price);
          }
        } catch {}
      };
      ws.onclose = () => { setIsLive(false); if (mountedRef.current) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { mountedRef.current = false; wsRef.current?.close(); };
  }, [symbol, range, injectTick]);

  return (
    <div className="relative">
      {range === '1D' && (
        <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
          isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isLive ? 'Live' : '...'}
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </div>
  );
}

export default function OptionChainPage() {
  const { symbol = 'NIFTY50' } = useParams<{ symbol: string }>();

  const [chain, setChain] = useState<OptionChainData | null>(null);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [expiry, setExpiry] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState('1D');
  const [wsLive, setWsLive] = useState(false);

  // WS refs for live spot price
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  // Trade modal state
  const [tradeModal, setTradeModal] = useState<{
    isOpen: boolean;
    type: 'CE' | 'PE';
    strike: number;
    ltp: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [chainRes, quoteRes] = await Promise.all([
        marketApi.getOptions(symbol, expiry),
        marketApi.getQuotes([symbol]),
      ]);
      setChain(chainRes.data);
      if (quoteRes.data?.[0]) {
        setQuote(quoteRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch option chain:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, expiry]);

  // Initial load + 3s refresh for option chain 
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s — safer refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  // WS for live spot price
  useEffect(() => {
    mountedRef.current = true;
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', symbols: [symbol] }));
        setWsLive(true);
      };
      ws.onmessage = (ev) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'quote' && (msg.symbol === symbol || msg.data?.symbol === symbol)) {
            const d = msg.data;
            if (d?.price > 0) {
              setQuote(prev => prev ? {
                ...prev,
                price: d.price,
                change: d.change ?? prev.change,
                percentage: d.percentage ?? prev.percentage,
                high: Math.max(prev.high, d.price),
                low: d.low > 0 ? Math.min(prev.low, d.low) : prev.low,
              } : d);
            }
          }
        } catch {}
      };
      ws.onclose = () => { setWsLive(false); if (mountedRef.current) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { mountedRef.current = false; wsRef.current?.close(); };
  }, [symbol]);

  const spotPrice = chain?.spotPrice || quote?.price || 23000;
  const isUp = (quote?.percentage ?? 0) >= 0;
  const maxOI = chain?.strikes.reduce((max, s) => Math.max(max, s.ce.oi, s.pe.oi), 0) || 1;
  const oiChartData = chain?.strikes.map(strike => ({
    strike: strike.strike,
    callOI: strike.ce.oi,
    putOI: strike.pe.oi,
    isATM: strike.isATM,
  })) || [];
  const atmStrike = chain?.strikes.find((s) => s.isATM)?.strike;

  const handleOptionClick = (type: 'CE' | 'PE', strike: number, ltp: number) => {
    setTradeModal({ isOpen: true, type, strike, ltp });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <BackButton fallbackPath="/Home/trade" />
              <div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">{symbol} Option Chain</h1>
                  {/* Live via WS */}
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    wsLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {wsLive ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {wsLive ? 'Live' : 'Connecting...'}
                  </span>
                </div>
                {quote && (
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                    <span className="text-xl sm:text-2xl font-bold">₹{fmt(quote.price)}</span>
                    <span className={`text-xs sm:text-sm font-semibold flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                      {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isUp ? '+' : ''}₹{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.percentage?.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Expiry Selector */}
              <div className="relative">
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value as 'weekly' | 'monthly')}
                  className="appearance-none bg-gray-100 text-sm font-medium px-3 sm:px-4 py-2 pr-9 sm:pr-10 rounded-lg cursor-pointer hover:bg-gray-200 outline-none"
                >
                  <option value="weekly">Weekly Expiry</option>
                  <option value="monthly">Monthly Expiry</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <span className="font-semibold text-gray-700">Price Chart</span>
                <div className="flex gap-1">
                  {['1D', '1W', '1M'].map(r => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        chartRange === r ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <ChartErrorBoundary>
                <MiniChart symbol={symbol} range={chartRange} />
              </ChartErrorBoundary>
            </div>

            {/* Quick Stats */}
            {quote && (
              <div className="bg-white rounded-xl border mt-4 p-4">
                <h3 className="font-semibold text-gray-700 mb-3">Market Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Open</p>
                    <p className="font-semibold">₹{fmt(quote.open)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Prev Close</p>
                    <p className="font-semibold">₹{fmt(quote.prevClose)}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">High</p>
                    <p className="font-semibold text-green-600">₹{fmt(quote.high)}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-gray-500">Low</p>
                    <p className="font-semibold text-red-500">₹{fmt(quote.low)}</p>
                  </div>
                </div>
              </div>
            )}

            {chain && oiChartData.length > 0 && (
              <div className="bg-white rounded-xl border mt-4">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Oi Distribution</span>
                  {atmStrike && (
                    <span className="text-xs text-blue-600 font-semibold">
                      ATM: {atmStrike.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="h-64 px-2 py-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={oiChartData} margin={{ left: -10, right: 10, top: 5 }}>
                      <XAxis
                        dataKey="strike"
                        tickFormatter={(val) => val.toLocaleString('en-IN')}
                        fontSize={10}
                      />
                      <Tooltip content={<OITooltipContent />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                      {atmStrike && (
                        <ReferenceLine x={atmStrike} stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'ATM', position: 'top', fill: '#2563eb', fontSize: 10 }} />
                      )}
                      <Bar dataKey="callOI" stackId="oi" name="Call OI" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="putOI" stackId="oi" name="Put OI" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Option Chain Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border overflow-hidden">
              {/* Option Chain Header */}
              <div className="px-4 py-3 border-b bg-gradient-to-r from-green-50 via-white to-red-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-800">Option Chain</span>
                  <span className="text-sm">
                    Spot: <span className="font-bold text-blue-600">₹{fmt(spotPrice)}</span>
                  </span>
                  {chain?.expiryDate && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      Expiry: {chain.expiryDate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-yellow-300 rounded" /> ATM
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-100 rounded" /> ITM Call
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-100 rounded" /> ITM Put
                  </span>
                </div>
              </div>

              {loading && !chain ? (
                <div className="p-12 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Loading option chain...
                </div>
              ) : !chain ? (
                <div className="p-12 text-center text-gray-400">Option chain unavailable</div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="border-b">
                        <th colSpan={6} className="py-3 text-center text-green-700 font-bold bg-green-50">CALLS</th>
                        <th className="py-3 text-center font-bold bg-gray-100 border-x">STRIKE</th>
                        <th colSpan={6} className="py-3 text-center text-red-700 font-bold bg-red-50">PUTS</th>
                      </tr>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="py-2 px-3 text-left bg-green-50/50">OI</th>
                        <th className="py-2 px-3 text-right bg-green-50/50">Vol</th>
                        <th className="py-2 px-3 text-right bg-green-50/50">Buy</th>
                        <th className="py-2 px-3 text-right bg-green-50/50">Sell</th>
                        <th className="py-2 px-3 text-right bg-green-50/50 font-semibold">LTP</th>
                        <th className="py-2 px-3 text-right bg-green-50/50">Chg</th>
                        <th className="py-2 px-3 text-center bg-gray-100 border-x"></th>
                        <th className="py-2 px-3 text-left bg-red-50/50">Chg</th>
                        <th className="py-2 px-3 text-left bg-red-50/50 font-semibold">LTP</th>
                        <th className="py-2 px-3 text-left bg-red-50/50">Buy</th>
                        <th className="py-2 px-3 text-left bg-red-50/50">Sell</th>
                        <th className="py-2 px-3 text-left bg-red-50/50">Vol</th>
                        <th className="py-2 px-3 text-right bg-red-50/50">OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chain.strikes.map(row => {
                        const isITMCall = row.strike < spotPrice;
                        const isITMPut = row.strike > spotPrice;

                        return (
                          <tr
                            key={row.strike}
                            className={`border-b hover:bg-blue-50/30 transition-colors ${
                              row.isATM ? 'bg-yellow-50' : ''
                            }`}
                          >
                            {/* Call OI */}
                            <td className={`py-2 px-3 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                              <div className="flex items-center gap-1">
                                <div
                                  className="h-2 bg-green-300 rounded-sm"
                                  style={{ width: `${(row.ce.oi / maxOI) * 50}px` }}
                                />
                                <span className="text-xs text-gray-600">{fmtCompact(row.ce.oi)}</span>
                              </div>
                            </td>
                            {/* Call Vol */}
                            <td className={`py-2 px-3 text-right text-xs text-gray-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                              {fmtCompact(row.ce.vol)}
                            </td>
                            {/* Call Change */}
                            <td className={`py-2 px-3 text-right text-xs text-gray-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                              {fmtPrice(row.ce.bidPrice || 0)}
                            </td>
                            {/* Call Ask */}
                            <td className={`py-2 px-3 text-right text-xs text-gray-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                              {fmtPrice(row.ce.askPrice || 0)}
                            </td>
                            {/* Call LTP - Clickable */}
                            <td
                              className={`py-2 px-3 text-right cursor-pointer hover:bg-green-200 transition-colors ${
                                isITMCall ? 'bg-green-100' : 'bg-green-50'
                              }`}
                              onClick={() => handleOptionClick('CE', row.strike, row.ce.ltp)}
                            >
                              <div className="flex items-center justify-end gap-1">
                                {row.ce.change >= 0 ? (
                                  <TrendingUp size={12} className="text-green-600" />
                                ) : (
                                  <TrendingDown size={12} className="text-red-500" />
                                )}
                                <span className="font-bold text-green-800">{row.ce.ltp.toFixed(2)}</span>
                              </div>
                            </td>
                            {/* Call Change */}
                            <td className={`py-2 px-3 text-right ${isITMCall ? 'bg-green-50/50' : ''}`}>
                              <span className={`text-xs font-medium ${row.ce.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {row.ce.change >= 0 ? '+' : ''}{row.ce.change.toFixed(1)}
                              </span>
                            </td>

                            {/* Strike */}
                            <td className={`py-2 px-3 text-center font-bold border-x ${
                              row.isATM ? 'bg-yellow-300 text-yellow-900' : 'bg-gray-50'
                            }`}>
                              {row.strike.toLocaleString()}
                              {row.isATM && <span className="block text-[10px] font-normal">ATM</span>}
                            </td>

                            {/* Put Change */}
                            <td className={`py-2 px-3 text-left ${isITMPut ? 'bg-red-50/50' : ''}`}>
                              <span className={`text-xs font-medium ${row.pe.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {row.pe.change >= 0 ? '+' : ''}{row.pe.change.toFixed(1)}
                              </span>
                            </td>
                            {/* Put LTP - Clickable */}
                            <td
                              className={`py-2 px-3 text-left cursor-pointer hover:bg-red-200 transition-colors ${
                                isITMPut ? 'bg-red-100' : 'bg-red-50'
                              }`}
                              onClick={() => handleOptionClick('PE', row.strike, row.pe.ltp)}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-red-800">{row.pe.ltp.toFixed(2)}</span>
                                {row.pe.change >= 0 ? (
                                  <TrendingUp size={12} className="text-green-600" />
                                ) : (
                                  <TrendingDown size={12} className="text-red-500" />
                                )}
                              </div>
                            </td>
                            {/* Put Bid */}
                            <td className={`py-2 px-3 text-left text-xs text-gray-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                              {fmtPrice(row.pe.bidPrice || 0)}
                            </td>
                            {/* Put Ask */}
                            <td className={`py-2 px-3 text-left text-xs text-gray-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                              {fmtPrice(row.pe.askPrice || 0)}
                            </td>
                            {/* Put Vol */}
                            <td className={`py-2 px-3 text-left text-xs text-gray-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                              {fmtCompact(row.pe.vol)}
                            </td>
                            {/* Put OI */}
                            <td className={`py-2 px-3 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs text-gray-600">{fmtCompact(row.pe.oi)}</span>
                                <div
                                  className="h-2 bg-red-300 rounded-sm"
                                  style={{ width: `${(row.pe.oi / maxOI) * 50}px` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      {tradeModal && (
        <TradeModal
          isOpen={tradeModal.isOpen}
          onClose={() => setTradeModal(null)}
          type={tradeModal.type}
          strike={tradeModal.strike}
          ltp={tradeModal.ltp}
          symbol={symbol}
          spotPrice={spotPrice}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
