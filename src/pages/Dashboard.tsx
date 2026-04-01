import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioCard from "../components/dashboard/PortfolioCard";
import Leaderboard from "../components/dashboard/Leaderboard";
import IndexCard from "../components/dashboard/IndexCard";
import StockTable from "../components/dashboard/StockTable";
import type { Stock } from "../components/dashboard/StockTable";
import { walletApi, leaderboardApi, analyticsApi, portfolioApi } from "../lib/api";
import { useMarketData } from "../hooks/useMarketData";

const INDEX_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'SENSEX', 'MIDCAP'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);

  // Live index data
  const { quotes: indexQuotes, loading: indexLoading } = useMarketData(INDEX_SYMBOLS);

  // Fetch live prices for all holdings
  const holdingSymbols = useMemo(() => holdings.map(h => h.symbol), [holdings]);
  const { quotes: holdingQuotes } = useMarketData(holdingSymbols);

  useEffect(() => {
    const fetchData = () => {
      walletApi.get().then(res => setWallet({ balance: Number(res.data.balance) })).catch(() => {});
      walletApi.getHoldings().then(res => setHoldings(res.data || [])).catch(() => {});
      portfolioApi.getOverview().then(res => setPortfolio(res.data || null)).catch(() => {});
      leaderboardApi.get().then(res => {
        // Backend sends { data: { data: [...], filter, limit } }
        const rawData = res?.data?.data || res?.data || [];
        const entries = Array.isArray(rawData) ? rawData : [];
        const lb = entries.slice(0, 5).map((u: any, i: number) => ({
          id: i + 1,
          rank: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
          name: u.name || 'Unknown',
          value: Math.round(u.winRate || 0),
        }));
        setLeaderboardData(lb);
      }).catch(() => {});
      analyticsApi.getStats?.({}).then(res => setStats(res.data)).catch(() => {});
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate portfolio values with live prices
  const invested = holdings.reduce(
    (sum: number, h: any) => sum + Number(h.quantity) * Number(h.avgPrice),
    0
  );

  const currentHoldingsValue = holdings.reduce((sum: number, h: any) => {
    const liveQuote = holdingQuotes[h.symbol.toUpperCase()];
    const ltp = (liveQuote?.price && liveQuote.price > 0) ? liveQuote.price : Number(h.avgPrice);
    return sum + ltp * Number(h.quantity);
  }, 0);

  const walletBalance = wallet?.balance ?? 100000;
  const totalPortfolioValue = currentHoldingsValue + walletBalance;

  // Prepare holdings with live data for display
  const holdingStocks: Stock[] = holdings.slice(0, 5).map((h: any, i: number) => {
    const liveQuote = holdingQuotes[h.symbol.toUpperCase()];
    const avgPrice = Number(h.avgPrice);
    const ltp = (liveQuote?.price && liveQuote.price > 0) ? liveQuote.price : avgPrice;
    const change = liveQuote?.change ?? 0;
    const percentage = liveQuote?.percentage ?? 0;

    return {
      id: i + 1,
      symbol: h.symbol,
      name: h.symbol,
      price: ltp,
      change,
      percentage,
    };
  });

  // Merge live data with fallback
  const FALLBACKS: Record<string, { name: string; price: number; change: number; percentage: number }> = {
    NIFTY50:   { name: 'NIFTY 50',    price: 22450, change: 0, percentage: 0 },
    BANKNIFTY: { name: 'BANK NIFTY',  price: 48200, change: 0, percentage: 0 },
    SENSEX:    { name: 'SENSEX',      price: 73800, change: 0, percentage: 0 },
    MIDCAP:    { name: 'MIDCAP',      price: 41500, change: 0, percentage: 0 },
  };

  const liveIndices = INDEX_SYMBOLS.map(sym => {
    const q = indexQuotes[sym];
    const fb = FALLBACKS[sym];
    return {
      symbol: sym,
      name: q?.name || fb.name,
      price: q?.price || fb.price,
      change: q?.change ?? fb.change,
      percentage: q?.percentage ?? fb.percentage,
    };
  });

  return (
    <main className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
      {/* Portfolio Overview - now shows real P&L */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PortfolioCard
          title="Portfolio Overview"
          invested={portfolio?.investedAmount || invested || 0}
          current={(portfolio?.investedAmount || 0) + (portfolio?.totalPnL || 0)}
        />
        <Leaderboard data={leaderboardData.length > 0 ? leaderboardData : [
          { id: 1, rank: "1st", name: "No data yet", value: 0 }
        ]} />
      </section>

      {/* Portfolio Stats - Real data */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Portfolio Value</p>
          <p className="text-2xl font-semibold">₹{totalPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Holdings + Wallet</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="text-2xl font-semibold">₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Available to trade</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-semibold">₹{invested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">In holdings</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">Holdings Count</p>
          <p className="text-2xl font-semibold">{holdings.length}</p>
          <p className="text-xs text-gray-400 mt-1">Active positions</p>
        </div>
      </section>

      {/* Live Index Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {liveIndices.map((item) => (
          <button
            key={item.symbol}
            onClick={() => navigate('/Home/trade')}
            className="text-left w-full"
          >
            <IndexCard
              name={item.name}
              price={item.price}
              change={item.change}
              percentage={item.percentage}
              className={`transition hover:shadow-md cursor-pointer ${indexLoading ? 'opacity-70' : ''}`}
            />
          </button>
        ))}
      </section>

      {/* Trading Stats - Primary */}
      {stats && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">Total Trades</p>
              <p className="text-2xl font-semibold">{stats.totalTrades}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.closedTrades} closed</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-2xl font-semibold">{stats.winRate?.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">From {stats.closedTrades} trades</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">Realized P&amp;L</p>
              <p className={`text-2xl font-semibold ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}₹{stats.totalPnl?.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">All closed trades</p>
            </div>
            <button
              onClick={() => navigate('/Home/positions')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-sm border border-blue-200 hover:shadow-md transition-all hover:border-blue-400 text-left"
            >
              <p className="text-sm text-blue-600 font-medium">Open Trades</p>
              <p className="text-2xl font-bold text-blue-700">{stats.openTrades}</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                View all positions →
              </p>
            </button>
          </section>

          {/* Trading Stats - Secondary */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
              <p className="text-sm text-green-700 font-medium">Best Trade</p>
              <p className="text-2xl font-bold text-green-600">+₹{stats.bestTrade?.toFixed(2) || 0}</p>
              <p className="text-xs text-green-600 mt-1">Highest profit</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 shadow-sm border border-red-200 hover:shadow-md transition-shadow">
              <p className="text-sm text-red-700 font-medium">Worst Trade</p>
              <p className="text-2xl font-bold text-red-600">₹{stats.worstTrade?.toFixed(2) || 0}</p>
              <p className="text-xs text-red-600 mt-1">Biggest loss</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">Average P&amp;L</p>
              <p className={`text-2xl font-semibold ${stats.avgPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats.avgPnl >= 0 ? '+' : ''}₹{stats.avgPnl?.toFixed(2) || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Per closed trade</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500">Risk/Reward</p>
              <p className="text-2xl font-semibold">
                {stats.avgRiskPerTrade > 0 ? `1:${(Math.abs(stats.avgPnl) / stats.avgRiskPerTrade).toFixed(2)}` : 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Average ratio</p>
            </div>
          </section>
        </>
      )}

      {/* Holdings & Indices Tables */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StockTable
          title={`Your Holdings (${holdings.length})`}
          data={holdingStocks}
          onViewAll={() => navigate('/Home/positions')}
        />
        <StockTable
          title="Top Indices (Live)"
          data={liveIndices.map((idx, i) => ({
            id: i + 1,
            symbol: idx.symbol,
            name: idx.name,
            price: idx.price,
            change: idx.change,
            percentage: idx.percentage,
          }))}
          onViewAll={() => navigate('/Home/trade')}
        />
      </section>
    </main>
  );
}
