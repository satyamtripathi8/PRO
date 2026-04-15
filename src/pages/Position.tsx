import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight, BarChart3, History } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

import PositionCard from "../components/positions/PositionCard";
import OrdersCard from "../components/positions/OrdersCard";

import type { Position, Order, OrderTab } from "../types/trading";
import { ordersApi, walletApi, portfolioApi } from "../lib/api";
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
  const [analyticsTab, setAnalyticsTab] = useState<"analytics" | "history">("analytics");
  const navigate = useNavigate();
  const [rawHoldings, setRawHoldings] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevPnL, setPrevPnL] = useState<number>(0);
  const [pnlDirection, setPnlDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // ── Realised P&L ──────────────────────────────────────────────────────────
  const [realisedPnL, setRealisedPnL] = useState<number>(0);
  const [realisedLoading, setRealisedLoading] = useState(false);

  // ── Portfolio analytics state ──────────────────────────────────────────────
  const [overview, setOverview] = useState<any>(null);
  const [equityHistory, setEquityHistory] = useState<any[]>([]);
  const [drawdown, setDrawdown] = useState<any>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [tradeTotal, setTradeTotal] = useState(0);
  const [tradePage, setTradePage] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState(30);

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

  // Fetch realised P&L independently
  useEffect(() => {
    setRealisedLoading(true);
    portfolioApi.getRealizedPnL(historyDays)
      .then(res => {
        const data = res.data ?? res;
        // API may return { totalRealizedPnL } or { realizedPnL } or a number directly
        const val = data?.totalRealizedPnL ?? data?.realizedPnL ?? data?.total ?? 0;
        setRealisedPnL(Number(val));
      })
      .catch(() => {
        // Fallback: use overview.realizedPnL if available
        if (overview?.realizedPnL != null) setRealisedPnL(Number(overview.realizedPnL));
      })
      .finally(() => setRealisedLoading(false));
  }, [historyDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Portfolio analytics fetchers ───────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [ovRes, histRes, ddRes] = await Promise.all([
        portfolioApi.getOverview(),
        portfolioApi.getHistory(historyDays),
        portfolioApi.getMaxDrawdown(historyDays),
      ]);
      setOverview(ovRes.data ?? null);
      setEquityHistory(histRes.data?.data ?? []);
      setDrawdown(ddRes.data ?? null);
    } catch { /* ignore */ } finally {
      setAnalyticsLoading(false);
    }
  }, [historyDays]);

  const fetchTradeHistory = useCallback(async (page = 1) => {
    setTradeLoading(true);
    try {
      const res = await portfolioApi.getTradeHistory({ days: historyDays, page, limit: 20 });
      setTradeHistory(res.data?.data ?? []);
      setTradeTotal(res.data?.meta?.total ?? 0);
      setTradePage(page);
    } catch { /* ignore */ } finally {
      setTradeLoading(false);
    }
  }, [historyDays]);

  useEffect(() => {
    fetchAnalytics();
    fetchTradeHistory(1);
  }, [fetchAnalytics, fetchTradeHistory]);

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

      {/* P&L HERO — Unrealised + Realised side by side */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Unrealised P&L card */}
        <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 ${
          totalPnL >= 0
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          <div className="absolute inset-0 opacity-10">
            {totalPnL >= 0
              ? <TrendingUp className="absolute right-3 top-3 w-24 h-24 text-white" />
              : <TrendingDown className="absolute right-3 top-3 w-24 h-24 text-white" />}
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium opacity-90">Unrealised P&amp;L</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 ${
                pnlDirection !== 'neutral' ? 'animate-bounce' : ''
              }`}>
                {pnlDirection === 'up' && <ArrowUpRight className="inline w-3 h-3" />}
                {pnlDirection === 'down' && <ArrowDownRight className="inline w-3 h-3" />}
                LIVE
              </span>
            </div>
            <p className={`text-3xl md:text-4xl font-bold tracking-tight transition-transform duration-300 ${
              pnlDirection !== 'neutral' ? 'scale-105' : ''
            }`}>
              {totalPnL >= 0 ? '+' : ''}₹{fmt(Math.abs(totalPnL))}
            </p>
            <p className="text-sm font-semibold mt-1 opacity-90">
              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}% on ₹{fmt(totalInvested)}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-xs opacity-70">Invested</p>
                <p className="text-sm font-semibold">₹{fmt(totalInvested)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Current</p>
                <p className="text-sm font-semibold">₹{fmt(totalCurrent)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Holdings</p>
                <p className="text-sm font-semibold">
                  {positions.length}
                  <span className="text-xs ml-1 opacity-80">
                    ({gainers}<span className="text-green-200">↑</span> {losers}<span className="text-red-200">↓</span>)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Realised P&L card */}
        <div className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-500 ${
          realisedPnL >= 0
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
            : 'bg-gradient-to-br from-orange-500 to-red-600'
        }`}>
          <div className="absolute inset-0 opacity-10">
            {realisedPnL >= 0
              ? <BarChart3 className="absolute right-3 top-3 w-24 h-24 text-white" />
              : <TrendingDown className="absolute right-3 top-3 w-24 h-24 text-white" />}
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium opacity-90">Realised P&amp;L</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20">
                Last {historyDays}D
              </span>
              {realisedLoading && <RefreshCw size={12} className="animate-spin opacity-70" />}
            </div>
            <p className="text-3xl md:text-4xl font-bold tracking-tight">
              {realisedPnL >= 0 ? '+' : ''}₹{fmt(Math.abs(realisedPnL))}
            </p>
            <p className="text-sm font-semibold mt-1 opacity-90">
              Closed / booked profits
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-xs opacity-70">Net P&amp;L</p>
                <p className={`text-sm font-semibold ${totalPnL + realisedPnL >= 0 ? '' : 'text-red-200'}`}>
                  {totalPnL + realisedPnL >= 0 ? '+' : ''}₹{fmt(Math.abs(totalPnL + realisedPnL))}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-70">Win Rate</p>
                <p className="text-sm font-semibold">
                  {overview?.winRate != null ? `${overview.winRate.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-70">Trades</p>
                <p className="text-sm font-semibold">
                  {overview?.totalTrades ?? '—'}
                </p>
              </div>
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

      {/* ── PORTFOLIO ANALYTICS SECTION ──────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex">
            {([
              { key: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
              { key: "history", label: "Trade History", icon: <History size={14} /> },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setAnalyticsTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  analyticsTab === t.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Days selector */}
          <div className="flex items-center gap-1 pr-2">
            {([7, 30, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setHistoryDays(d)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  historyDays === d
                    ? "bg-blue-500 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        {/* ── Analytics tab ── */}
        {analyticsTab === "analytics" && (
          <div className="p-4 space-y-5">
            {analyticsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Metric cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Realized P&L",
                      value: overview?.realizedPnL ?? 0,
                      format: (v: number) => `${v >= 0 ? "+" : ""}₹${fmt(Math.abs(v))}`,
                      color: (v: number) => v >= 0 ? "text-green-600" : "text-red-500",
                    },
                    {
                      label: "Win Rate",
                      value: overview?.winRate ?? 0,
                      format: (v: number) => `${v.toFixed(1)}%`,
                      color: (v: number) => v >= 50 ? "text-green-600" : "text-orange-500",
                      sub: overview ? `${overview.winCount}W / ${overview.lossCount}L` : "",
                    },
                    {
                      label: "Max Drawdown",
                      value: drawdown?.maxDrawdownPct ?? 0,
                      format: (v: number) => `-${v.toFixed(2)}%`,
                      color: () => "text-red-500",
                      sub: drawdown?.maxDrawdown ? `₹${fmt(drawdown.maxDrawdown)}` : "",
                    },
                    {
                      label: "Avg Trade P&L",
                      value: overview?.avgTradePnL ?? 0,
                      format: (v: number) => `${v >= 0 ? "+" : ""}₹${fmt(Math.abs(v))}`,
                      color: (v: number) => v >= 0 ? "text-green-600" : "text-red-500",
                      sub: overview ? `${overview.totalTrades} trades` : "",
                    },
                  ].map(card => (
                    <div key={card.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                      <p className={`text-xl font-bold ${card.color(card.value)}`}>
                        {card.format(card.value)}
                      </p>
                      {card.sub && <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Best / Worst trade row */}
                {overview && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">Best Trade</p>
                      <p className="text-lg font-bold text-green-600">
                        {overview.bestTrade != null ? `+₹${fmt(overview.bestTrade)}` : "—"}
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">Worst Trade</p>
                      <p className="text-lg font-bold text-red-500">
                        {overview.worstTrade != null ? `₹${fmt(overview.worstTrade)}` : "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Equity curve */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Equity Curve (Daily P&L)</p>
                  {equityHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-xl">
                      <BarChart3 size={32} className="mb-2 opacity-30" />
                      <p className="text-sm">No portfolio history yet. Trade to generate data.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={equityHistory} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickFormatter={d => d.slice(5)}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                          width={60}
                        />
                        <Tooltip
                          formatter={(v: any) => [`₹${fmt(v)}`, "Total P&L"]}
                          labelFormatter={l => `Date: ${l}`}
                          contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalPnL"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#pnlGrad)"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Unrealized breakdown */}
                {overview?.unrealizedBreakdown?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Unrealized P&L Breakdown</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500 text-xs">
                            <th className="text-left px-3 py-2">Symbol</th>
                            <th className="text-right px-3 py-2">Qty</th>
                            <th className="text-right px-3 py-2">Avg Price</th>
                            <th className="text-right px-3 py-2">CMP</th>
                            <th className="text-right px-3 py-2">Unrealized P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.unrealizedBreakdown.map((row: any) => (
                            <tr key={row.symbol} className="border-t border-slate-50 hover:bg-slate-50">
                              <td className="px-3 py-2 font-medium">{row.symbol}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{row.quantity}</td>
                              <td className="px-3 py-2 text-right text-slate-600">₹{fmt(row.avgPrice)}</td>
                              <td className="px-3 py-2 text-right text-slate-600">₹{fmt(row.currentPrice)}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${row.unrealizedPnL >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {row.unrealizedPnL >= 0 ? "+" : ""}₹{fmt(row.unrealizedPnL)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Trade History tab ── */}
        {analyticsTab === "history" && (
          <div className="p-4 space-y-3">
            {tradeLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <History size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No closed trades in this period.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500 text-xs">
                        <th className="text-left px-3 py-2">Symbol</th>
                        <th className="text-left px-3 py-2">Side</th>
                        <th className="text-right px-3 py-2">Qty</th>
                        <th className="text-right px-3 py-2">Entry</th>
                        <th className="text-right px-3 py-2">Exit</th>
                        <th className="text-right px-3 py-2">P&L</th>
                        <th className="text-right px-3 py-2">Closed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradeHistory.map((t: any) => (
                        <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-medium">{t.symbol}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              t.side === "BUY"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}>
                              {t.side}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{t.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">₹{fmt(t.entryPrice)}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">
                            {t.exitPrice != null ? `₹${fmt(t.exitPrice)}` : "—"}
                          </td>
                          <td className={`px-3 py-2.5 text-right font-semibold ${
                            t.pnl == null ? "text-slate-400" : t.pnl >= 0 ? "text-green-600" : "text-red-500"
                          }`}>
                            {t.pnl != null
                              ? `${t.pnl >= 0 ? "+" : ""}₹${fmt(Math.abs(t.pnl))}`
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-400 text-xs">
                            {t.closedAt
                              ? new Date(t.closedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {tradeTotal > 20 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">{tradeTotal} trades total</span>
                    <div className="flex gap-2">
                      <button
                        disabled={tradePage === 1}
                        onClick={() => fetchTradeHistory(tradePage - 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        ← Prev
                      </button>
                      <span className="flex items-center text-xs text-slate-500 px-2">
                        {tradePage} / {Math.ceil(tradeTotal / 20)}
                      </span>
                      <button
                        disabled={tradePage >= Math.ceil(tradeTotal / 20)}
                        onClick={() => fetchTradeHistory(tradePage + 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

    </main>
  );
}
