import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";

import PositionCard from "../components/positions/PositionCard";
import OrdersCard from "../components/positions/OrdersCard";

import type { Position, Order, OrderTab } from "../types/trading";
import { ordersApi, walletApi } from "../lib/api";
import { useMarketData } from "../hooks/useMarketData";

// Company logo URLs (same as Trade.tsx)
const COMPANY_LOGOS: Record<string, string> = {
  TCS: 'https://logo.clearbit.com/tcs.com',
  INFY: 'https://logo.clearbit.com/infosys.com',
  WIPRO: 'https://logo.clearbit.com/wipro.com',
  HCLTECH: 'https://logo.clearbit.com/hcltech.com',
  TECHM: 'https://logo.clearbit.com/techmahindra.com',
  HDFCBANK: 'https://logo.clearbit.com/hdfcbank.com',
  ICICIBANK: 'https://logo.clearbit.com/icicibank.com',
  SBIN: 'https://logo.clearbit.com/sbi.co.in',
  KOTAKBANK: 'https://logo.clearbit.com/kotak.com',
  AXISBANK: 'https://logo.clearbit.com/axisbank.com',
  INDUSINDBK: 'https://logo.clearbit.com/indusind.com',
  RELIANCE: 'https://logo.clearbit.com/ril.com',
  ONGC: 'https://logo.clearbit.com/ongcindia.com',
  BPCL: 'https://logo.clearbit.com/bharatpetroleum.in',
  NTPC: 'https://logo.clearbit.com/ntpc.co.in',
  POWERGRID: 'https://logo.clearbit.com/powergrid.in',
  COALINDIA: 'https://logo.clearbit.com/coalindia.in',
  TATAMOTORS: 'https://logo.clearbit.com/tatamotors.com',
  MARUTI: 'https://logo.clearbit.com/marutisuzuki.com',
  MM: 'https://logo.clearbit.com/mahindra.com',
  EICHERMOT: 'https://logo.clearbit.com/eicher.in',
  HEROMOTOCO: 'https://logo.clearbit.com/heromotocorp.com',
  HINDUNILVR: 'https://logo.clearbit.com/hul.co.in',
  ITC: 'https://logo.clearbit.com/itcportal.com',
  NESTLEIND: 'https://logo.clearbit.com/nestle.in',
  BRITANNIA: 'https://logo.clearbit.com/britannia.co.in',
  TATACONSUM: 'https://logo.clearbit.com/tataconsumer.com',
  SUNPHARMA: 'https://logo.clearbit.com/sunpharma.com',
  DRREDDY: 'https://logo.clearbit.com/drreddys.com',
  CIPLA: 'https://logo.clearbit.com/cipla.com',
  DIVISLAB: 'https://logo.clearbit.com/divislabs.com',
  APOLLOHOSP: 'https://logo.clearbit.com/apollohospitals.com',
  TATASTEEL: 'https://logo.clearbit.com/tatasteel.com',
  JSWSTEEL: 'https://logo.clearbit.com/jsw.in',
  HINDALCO: 'https://logo.clearbit.com/hindalco.com',
  LT: 'https://logo.clearbit.com/larsentoubro.com',
  ADANIPORTS: 'https://logo.clearbit.com/adaniports.com',
  ADANIENT: 'https://logo.clearbit.com/adani.com',
  ULTRACEMCO: 'https://logo.clearbit.com/ultratechcement.com',
  GRASIM: 'https://logo.clearbit.com/grasim.com',
  BAJFINANCE: 'https://logo.clearbit.com/bajajfinserv.in',
  BAJAJFINSV: 'https://logo.clearbit.com/bajajfinserv.in',
  SBILIFE: 'https://logo.clearbit.com/sbilife.co.in',
  HDFCLIFE: 'https://logo.clearbit.com/hdfclife.com',
  TITAN: 'https://logo.clearbit.com/titan.co.in',
  ASIANPAINT: 'https://logo.clearbit.com/asianpaints.com',
  BHARTIARTL: 'https://logo.clearbit.com/airtel.in',
  IDEA: 'https://logo.clearbit.com/myvi.in',
  SUZLON: 'https://logo.clearbit.com/suzlon.com',
};

// Format helpers
function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

// Company Logo component with fallback
function CompanyLogo({ symbol, size = 40 }: { symbol: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = COMPANY_LOGOS[symbol];

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

export default function Positions() {
  const [tab, setTab] = useState<OrderTab>("stocks");
  const navigate = useNavigate();
  const [rawHoldings, setRawHoldings] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevPnL, setPrevPnL] = useState<number>(0);
  const [pnlDirection, setPnlDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Fetch all holding symbols and get live prices
  const holdingSymbols = useMemo(
    () => rawHoldings.map(h => h.symbol as string),
    [rawHoldings]
  );
  const { quotes, lastUpdated, refetch } = useMarketData(holdingSymbols);

  const fetchData = async () => {
    setLoading(true);
    try {
      const holdingsRes = await walletApi.getHoldings();
      setRawHoldings(holdingsRes.data || []);

      const ordersRes = await ordersApi.list({ limit: 20 });
      const ordersData = (ordersRes.data || []).map((o: any, i: number) => ({
        id: i + 1,
        date: new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        time: new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        symbol: o.symbol,
        type: o.side as "BUY" | "SELL",
        qty: Number(o.quantity),
        avg: Number(o.entryPrice),
      }));
      setOrders(ordersData);
    } catch {
      // Keep empty arrays
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Merge holdings with live LTP for real-time P&L
  const positions: Position[] = rawHoldings.map((h: any, i: number) => {
    const liveQuote = quotes[h.symbol.toUpperCase()];
    const avgPrice = Number(h.avgPrice);
    const qty = Number(h.quantity);
    // Use avgPrice as fallback when live data is unavailable OR price is 0
    const ltp = (liveQuote?.price && liveQuote.price > 0) ? liveQuote.price : avgPrice;
    const pnl = (ltp - avgPrice) * qty;
    const change = liveQuote?.change ?? 0;
    const percentage = liveQuote?.percentage ?? 0;
    const hasLiveData = !!(liveQuote?.price && liveQuote.price > 0);
    return {
      id: i + 1,
      symbol: h.symbol,
      exchange: "NSE",
      qty,
      avg: avgPrice,
      ltp,
      pnl,
      product: "CNC",
      change,
      percentage,
      hasLiveData, // Track if we have live data for this position
    };
  });

  const totalPnL = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalInvested = positions.reduce((acc, p) => acc + p.avg * p.qty, 0);
  const totalCurrent = positions.reduce((acc, p) => acc + p.ltp * p.qty, 0);
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Track P&L direction changes for animation
  useEffect(() => {
    if (totalPnL > prevPnL) {
      setPnlDirection('up');
    } else if (totalPnL < prevPnL) {
      setPnlDirection('down');
    }
    setPrevPnL(totalPnL);

    // Reset direction after animation
    const timer = setTimeout(() => setPnlDirection('neutral'), 1000);
    return () => clearTimeout(timer);
  }, [totalPnL]);

  // Get overall market trend
  const gainers = positions.filter(p => p.pnl > 0).length;
  const losers = positions.filter(p => p.pnl < 0).length;

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Positions &amp; Orders</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live P&amp;L updates
            {lastUpdated && (
              <span className="text-green-600">
                · {lastUpdated.toLocaleTimeString('en-IN')}
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/Home/trade")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition"
          >
            Go to Trade
          </button>

          <button
            onClick={() => { fetchData(); refetch(); }}
            className="bg-slate-200 hover:bg-slate-300 px-5 py-2 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* LIVE P&L HERO CARD */}
      <section className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ${
        totalPnL >= 0
          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
          : 'bg-gradient-to-br from-red-500 to-rose-600'
      }`}>
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className={`absolute inset-0 ${pnlDirection === 'up' ? 'animate-pulse' : ''}`}>
            {totalPnL >= 0 ? (
              <TrendingUp className="absolute right-4 top-4 w-32 h-32 text-white" />
            ) : (
              <TrendingDown className="absolute right-4 top-4 w-32 h-32 text-white" />
            )}
          </div>
        </div>

        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium opacity-90">Total Unrealised P&amp;L</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              pnlDirection === 'up' ? 'bg-white/30 animate-bounce' :
              pnlDirection === 'down' ? 'bg-white/30 animate-bounce' : 'bg-white/20'
            }`}>
              {pnlDirection === 'up' && <ArrowUpRight className="inline w-3 h-3" />}
              {pnlDirection === 'down' && <ArrowDownRight className="inline w-3 h-3" />}
              LIVE
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <p className={`text-4xl md:text-5xl font-bold tracking-tight transition-transform duration-300 ${
              pnlDirection !== 'neutral' ? 'scale-105' : ''
            }`}>
              {totalPnL >= 0 ? '+' : ''}₹{fmt(Math.abs(totalPnL))}
            </p>
            <span className={`text-lg font-semibold px-3 py-1 rounded-full ${
              pnlPct >= 0 ? 'bg-white/20' : 'bg-white/20'
            }`}>
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-sm opacity-75">Invested</p>
              <p className="text-lg font-semibold">₹{fmt(totalInvested)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Current</p>
              <p className="text-lg font-semibold">₹{fmt(totalCurrent)}</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Holdings</p>
              <p className="text-lg font-semibold flex items-center gap-2">
                {positions.length}
                <span className="text-xs opacity-75">
                  ({gainers} <span className="text-green-200">↑</span> · {losers} <span className="text-red-200">↓</span>)
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Top Gainer</p>
          {positions.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <CompanyLogo symbol={[...positions].sort((a, b) => b.pnl - a.pnl)[0]?.symbol || ''} size={28} />
                <p className="font-semibold">{[...positions].sort((a, b) => b.pnl - a.pnl)[0]?.symbol}</p>
              </div>
              <p className="text-green-600 font-medium mt-1">
                +₹{fmt([...positions].sort((a, b) => b.pnl - a.pnl)[0]?.pnl || 0)}
              </p>
            </>
          ) : (
            <p className="text-slate-400 mt-2">No positions</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Top Loser</p>
          {positions.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <CompanyLogo symbol={[...positions].sort((a, b) => a.pnl - b.pnl)[0]?.symbol || ''} size={28} />
                <p className="font-semibold">{[...positions].sort((a, b) => a.pnl - b.pnl)[0]?.symbol}</p>
              </div>
              <p className="text-red-500 font-medium mt-1">
                ₹{fmt([...positions].sort((a, b) => a.pnl - b.pnl)[0]?.pnl || 0)}
              </p>
            </>
          ) : (
            <p className="text-slate-400 mt-2">No positions</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Day's Best</p>
          {positions.length > 0 && positions.some(p => (p as any).percentage) ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <CompanyLogo symbol={[...positions].sort((a, b) => ((b as any).percentage || 0) - ((a as any).percentage || 0))[0]?.symbol || ''} size={28} />
                <p className="font-semibold">{[...positions].sort((a, b) => ((b as any).percentage || 0) - ((a as any).percentage || 0))[0]?.symbol}</p>
              </div>
              <p className="text-green-600 font-medium mt-1">
                +{(([...positions].sort((a, b) => ((b as any).percentage || 0) - ((a as any).percentage || 0))[0] as any)?.percentage || 0).toFixed(2)}%
              </p>
            </>
          ) : (
            <p className="text-slate-400 mt-2">No data</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow">
          <p className="text-sm text-slate-500">Day's Worst</p>
          {positions.length > 0 && positions.some(p => (p as any).percentage) ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <CompanyLogo symbol={[...positions].sort((a, b) => ((a as any).percentage || 0) - ((b as any).percentage || 0))[0]?.symbol || ''} size={28} />
                <p className="font-semibold">{[...positions].sort((a, b) => ((a as any).percentage || 0) - ((b as any).percentage || 0))[0]?.symbol}</p>
              </div>
              <p className="text-red-500 font-medium mt-1">
                {(([...positions].sort((a, b) => ((a as any).percentage || 0) - ((b as any).percentage || 0))[0] as any)?.percentage || 0).toFixed(2)}%
              </p>
            </>
          ) : (
            <p className="text-slate-400 mt-2">No data</p>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PositionCard pnl={totalPnL} positions={positions} logos={COMPANY_LOGOS} />
        <OrdersCard tab={tab} onTabChange={setTab} orders={orders} logos={COMPANY_LOGOS} />
      </section>

    </main>
  );
}
