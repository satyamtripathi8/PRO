import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, ArrowLeft, Wallet, Package, History, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import { marketApi, ordersApi, walletApi } from '../lib/api';
import CandlestickChart from '../components/trade/CandlestickChart';
import ChartErrorBoundary from '../components/trade/ChartErrorBoundary';

// ─── Symbol Config ────────────────────────────────────────────────────────────

// Symbol config removed: TradingView widget replaced with lightweight-charts

// Index branding colors (gradient from/to)
const INDEX_COLORS: Record<string, { from: string; to: string; icon: string }> = {
  NIFTY50: { from: 'from-blue-600', to: 'to-blue-800', icon: '📈' },
  BANKNIFTY: { from: 'from-purple-600', to: 'to-purple-800', icon: '🏦' },
  FINNIFTY: { from: 'from-emerald-600', to: 'to-emerald-800', icon: '💹' },
  MIDCPNIFTY: { from: 'from-orange-500', to: 'to-orange-700', icon: '📊' },
  SENSEX: { from: 'from-red-600', to: 'to-red-800', icon: '🔴' },
  BANKEX: { from: 'from-pink-600', to: 'to-pink-800', icon: '🏛️' },
  NIFTYIT: { from: 'from-cyan-600', to: 'to-cyan-800', icon: '💻' },
  MIDCAP: { from: 'from-amber-500', to: 'to-amber-700', icon: '📉' },
};

const INDICES = [
  { symbol: 'NIFTY50', label: 'NIFTY 50', hasOptions: true },
  { symbol: 'BANKNIFTY', label: 'BANK NIFTY', hasOptions: true },
  { symbol: 'FINNIFTY', label: 'FIN NIFTY', hasOptions: true },
  { symbol: 'MIDCPNIFTY', label: 'MIDCAP NIFTY', hasOptions: true },
  { symbol: 'SENSEX', label: 'SENSEX', hasOptions: true },
  { symbol: 'BANKEX', label: 'BANKEX', hasOptions: true },
  { symbol: 'NIFTYIT', label: 'NIFTY IT', hasOptions: false },
  { symbol: 'MIDCAP', label: 'NIFTY MIDCAP 100', hasOptions: false },
];

// F&O enabled indices (can trade options)
const FO_INDICES = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];

// Company logo URLs (using logo.clearbit.com and company domains)
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

// Fallback colors for companies without logos
const SECTOR_COLORS: Record<string, string> = {
  IT: 'from-blue-500 to-indigo-600',
  Banks: 'from-emerald-500 to-teal-600',
  Energy: 'from-amber-500 to-orange-600',
  Auto: 'from-red-500 to-rose-600',
  FMCG: 'from-green-500 to-emerald-600',
  Pharma: 'from-purple-500 to-violet-600',
  Metals: 'from-gray-500 to-slate-600',
  Infra: 'from-yellow-500 to-amber-600',
  Finance: 'from-cyan-500 to-blue-600',
  Consumer: 'from-pink-500 to-rose-600',
  Telecom: 'from-indigo-500 to-purple-600',
};

const COMPANIES = [
  // IT Sector
  { symbol: 'TCS', label: 'TCS', sector: 'IT' },
  { symbol: 'INFY', label: 'Infosys', sector: 'IT' },
  { symbol: 'WIPRO', label: 'Wipro', sector: 'IT' },
  { symbol: 'HCLTECH', label: 'HCL Tech', sector: 'IT' },
  { symbol: 'TECHM', label: 'Tech Mahindra', sector: 'IT' },
  // Banking
  { symbol: 'HDFCBANK', label: 'HDFC Bank', sector: 'Banks' },
  { symbol: 'ICICIBANK', label: 'ICICI Bank', sector: 'Banks' },
  { symbol: 'SBIN', label: 'State Bank', sector: 'Banks' },
  { symbol: 'KOTAKBANK', label: 'Kotak Bank', sector: 'Banks' },
  { symbol: 'AXISBANK', label: 'Axis Bank', sector: 'Banks' },
  { symbol: 'INDUSINDBK', label: 'IndusInd Bank', sector: 'Banks' },
  // Oil & Gas / Energy
  { symbol: 'RELIANCE', label: 'Reliance', sector: 'Energy' },
  { symbol: 'ONGC', label: 'ONGC', sector: 'Energy' },
  { symbol: 'BPCL', label: 'BPCL', sector: 'Energy' },
  { symbol: 'NTPC', label: 'NTPC', sector: 'Energy' },
  { symbol: 'POWERGRID', label: 'Power Grid', sector: 'Energy' },
  { symbol: 'COALINDIA', label: 'Coal India', sector: 'Energy' },
  // Automobile
  { symbol: 'TATAMOTORS', label: 'Tata Motors', sector: 'Auto' },
  { symbol: 'MARUTI', label: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'MM', label: 'M&M', sector: 'Auto' },
  { symbol: 'EICHERMOT', label: 'Eicher Motors', sector: 'Auto' },
  { symbol: 'HEROMOTOCO', label: 'Hero Moto', sector: 'Auto' },
  // FMCG
  { symbol: 'HINDUNILVR', label: 'HUL', sector: 'FMCG' },
  { symbol: 'ITC', label: 'ITC', sector: 'FMCG' },
  { symbol: 'NESTLEIND', label: 'Nestle', sector: 'FMCG' },
  { symbol: 'BRITANNIA', label: 'Britannia', sector: 'FMCG' },
  { symbol: 'TATACONSUM', label: 'Tata Consumer', sector: 'FMCG' },
  // Pharma
  { symbol: 'SUNPHARMA', label: 'Sun Pharma', sector: 'Pharma' },
  { symbol: 'DRREDDY', label: "Dr Reddy's", sector: 'Pharma' },
  { symbol: 'CIPLA', label: 'Cipla', sector: 'Pharma' },
  { symbol: 'DIVISLAB', label: "Divi's Lab", sector: 'Pharma' },
  { symbol: 'APOLLOHOSP', label: 'Apollo Hospital', sector: 'Pharma' },
  // Metals & Mining
  { symbol: 'TATASTEEL', label: 'Tata Steel', sector: 'Metals' },
  { symbol: 'JSWSTEEL', label: 'JSW Steel', sector: 'Metals' },
  { symbol: 'HINDALCO', label: 'Hindalco', sector: 'Metals' },
  // Infrastructure
  { symbol: 'LT', label: 'L&T', sector: 'Infra' },
  { symbol: 'ADANIPORTS', label: 'Adani Ports', sector: 'Infra' },
  { symbol: 'ADANIENT', label: 'Adani Ent', sector: 'Infra' },
  { symbol: 'ULTRACEMCO', label: 'UltraTech', sector: 'Infra' },
  { symbol: 'GRASIM', label: 'Grasim', sector: 'Infra' },
  // Finance
  { symbol: 'BAJFINANCE', label: 'Bajaj Finance', sector: 'Finance' },
  { symbol: 'BAJAJFINSV', label: 'Bajaj Finserv', sector: 'Finance' },
  { symbol: 'SBILIFE', label: 'SBI Life', sector: 'Finance' },
  { symbol: 'HDFCLIFE', label: 'HDFC Life', sector: 'Finance' },
  // Others
  { symbol: 'TITAN', label: 'Titan', sector: 'Consumer' },
  { symbol: 'ASIANPAINT', label: 'Asian Paints', sector: 'Consumer' },
  { symbol: 'BHARTIARTL', label: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'IDEA', label: 'Vi', sector: 'Telecom' },
  { symbol: 'SUZLON', label: 'Suzlon', sector: 'Energy' },
];

// Company Logo component with fallback
function CompanyLogo({ symbol, sector, size = 40 }: { symbol: string; sector?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = COMPANY_LOGOS[symbol];
  const fallbackColor = sector ? SECTOR_COLORS[sector] : 'from-blue-500 to-purple-600';

  if (!logoUrl || imgError) {
    return (
      <div
        className={`bg-gradient-to-br ${fallbackColor} rounded-xl flex items-center justify-center text-white font-bold`}
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

const SECTORS = ['All', 'IT', 'Banks', 'Energy', 'Auto', 'FMCG', 'Pharma', 'Metals', 'Infra', 'Finance', 'Consumer', 'Telecom'];

const ALL_SYMBOLS = [...INDICES.map(i => i.symbol), ...COMPANIES.map(c => c.symbol)];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getResponsiveVisibleCount() {
  if (typeof window === 'undefined') return 1;
  const width = window.innerWidth;
  if (width < 640) return 1;
  if (width < 1024) return 2;
  if (width < 1280) return 3;
  return 4;
}

// ─── Main Trade Page ──────────────────────────────────────────────────────────
export default function Trade() {
  const location = useLocation();
  
  const [view, setView] = useState<'explore' | 'detail'>('explore');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState('All');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [visibleIndexCount, setVisibleIndexCount] = useState(getResponsiveVisibleCount);
  const [indexPage, setIndexPage] = useState(0);

  const { quotes, loading, lastUpdated } = useMarketData(ALL_SYMBOLS);

  // Listen to navigation state from search click
  useEffect(() => {
    const state = location.state as any;
    if (state?.searchQuery) {
      setSelectedSymbol(state.searchQuery);
      setView('detail');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [location.state]);

  useEffect(() => {
    const handleResize = () => {
      setVisibleIndexCount(prev => {
        const next = getResponsiveVisibleCount();
        return prev === next ? prev : next;
      });
    };

    if (typeof window === 'undefined') return;

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(INDICES.length / visibleIndexCount) - 1);
    setIndexPage(prev => Math.min(prev, maxPage));
  }, [visibleIndexCount]);

  // Fetch wallet, holdings, and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, holdingsRes, ordersRes] = await Promise.all([
          walletApi.get(),
          walletApi.getHoldings(),
          ordersApi.list({ limit: 10 }),
        ]);
        setWalletBalance(walletRes.data?.balance ?? null);
        setHoldings(holdingsRes.data ?? []);
        setRecentOrders(ordersRes.data?.data ?? []);
      } catch {}
    };
    fetchData();
  }, []);

  // Live search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await marketApi.search(searchQuery);
        setSearchResults(res.data ?? []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStockClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    setView('detail');
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleBackToExplore = () => {
    setView('explore');
    setSelectedSymbol('');
  };

  const filteredCompanies = COMPANIES.filter(company => {
    const matchesSearch = searchQuery === '' ||
      company.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'All' || company.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const totalIndexPages = Math.ceil(INDICES.length / visibleIndexCount) || 1;
  const visibleIndices = INDICES.slice(
    indexPage * visibleIndexCount,
    indexPage * visibleIndexCount + visibleIndexCount
  );
  const canGoPrev = indexPage > 0;
  const canGoNext = indexPage < totalIndexPages - 1;

  if (view === 'detail' && selectedSymbol) {
    return (
      <StockDetailView
        symbol={selectedSymbol}
        quotes={quotes}
        onBack={handleBackToExplore}
        onOrderPlaced={() => {
          walletApi.get().then(res => setWalletBalance(res.data?.balance ?? null));
          walletApi.getHoldings().then(res => setHoldings(res.data ?? []));
          ordersApi.list({ limit: 10 }).then(res => setRecentOrders(res.data?.data ?? []));
        }}
      />
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Trade Route</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-gray-500">Real-time market data</span>
              {lastUpdated && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  {formatTime(lastUpdated)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Quick Stats */}
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => setShowPortfolio(!showPortfolio)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${showPortfolio ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                <Package size={18} />
                <span className="font-medium hidden sm:inline">{holdings.length} Holdings</span>
                <span className="font-medium sm:hidden">{holdings.length}</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${showHistory ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              >
                <History size={18} />
                <span className="font-medium hidden sm:inline">History</span>
              </button>
            </div>
            {walletBalance !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
                <Wallet size={18} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className="text-sm font-bold text-gray-900">₹{fmt(walletBalance)}</p>
                </div>
              </div>
            )}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full sm:w-48 md:w-64 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-80 bg-white border rounded-lg shadow-xl z-30 max-h-64 overflow-y-auto">
                  {searchResults.map((result: any) => (
                    <button
                      key={result.symbol}
                      onClick={() => handleStockClick(result.symbol)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center justify-between text-left border-b last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{result.symbol}</p>
                        <p className="text-xs text-gray-500 truncate">{result.name}</p>
                      </div>
                      <span className="text-xs text-gray-400">{result.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Index cards with simple button navigation */}
        <div className="px-3 sm:px-6 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIndexPage(prev => Math.max(prev - 1, 0))}
              disabled={!canGoPrev}
              className={`p-2 rounded-full border shadow-sm transition-colors ${
                canGoPrev ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 overflow-hidden">
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${visibleIndexCount}, minmax(0, 1fr))` }}
              >
                {visibleIndices.map((index) => {
                  const q = quotes[index.symbol];
                  const isUp = (q?.percentage ?? 0) >= 0;
                  const colors = INDEX_COLORS[index.symbol] || { from: 'from-slate-700', to: 'to-slate-900', icon: '📊' };
                  return (
                    <button
                      key={index.symbol}
                      onClick={() => handleStockClick(index.symbol)}
                      className={`bg-gradient-to-br ${colors.from} ${colors.to} rounded-xl p-4 hover:shadow-lg transition-all text-white relative overflow-hidden`}
                    >
                      <span className="absolute -right-2 -bottom-2 text-5xl opacity-20">{colors.icon}</span>

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{colors.icon}</span>
                          <p className="text-sm font-semibold opacity-95">{index.label}</p>
                        </div>
                      </div>
                      {q ? (
                        <div className="mt-3 relative z-10">
                          <p className="text-2xl font-bold tracking-tight">{fmt(q.price)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-green-300' : 'text-red-300'}`}>
                              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {isUp ? '+' : ''}{q.change?.toFixed(2)}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isUp ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'}`}>
                              {isUp ? '+' : ''}{q.percentage?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <div className="h-7 w-24 bg-white/20 rounded animate-pulse" />
                          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mt-2" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => setIndexPage(prev => Math.min(prev + 1, totalIndexPages - 1))}
              disabled={!canGoNext}
              className={`p-2 rounded-full border shadow-sm transition-colors ${
                canGoNext ? 'bg-white hover:bg-gray-50 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Showing {indexPage * visibleIndexCount + 1}-{Math.min((indexPage + 1) * visibleIndexCount, INDICES.length)} of {INDICES.length} indices
          </p>
        </div>
      </div>

      {/* Portfolio Panel */}
      {showPortfolio && holdings.length > 0 && (
        <div className="mx-3 sm:mx-6 mt-4 bg-white rounded-xl border p-3 sm:p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={20} /> Your Holdings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {holdings.map((holding: any) => {
              const q = quotes[holding.symbol];
              const currentValue = q ? q.price * Number(holding.quantity) : 0;
              const investedValue = Number(holding.avgPrice) * Number(holding.quantity);
              const pnl = currentValue - investedValue;
              const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
              const company = COMPANIES.find(c => c.symbol === holding.symbol);
              return (
                <button
                  key={holding.symbol}
                  onClick={() => handleStockClick(holding.symbol)}
                  className="p-3 border rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CompanyLogo symbol={holding.symbol} sector={company?.sector} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate text-sm">{holding.symbol}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{holding.quantity} shares @ ₹{fmt(Number(holding.avgPrice))}</p>
                  <div className="mt-2">
                    <p className="text-sm font-bold">₹{fmt(currentValue)}</p>
                    <p className={`text-xs font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {pnl >= 0 ? '+' : ''}₹{fmt(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trade History Panel */}
      {showHistory && recentOrders.length > 0 && (
        <div className="mx-3 sm:mx-6 mt-4 bg-white rounded-xl border p-3 sm:p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <History size={20} /> Recent Trades
          </h3>
          <div className="space-y-2">
            {recentOrders.slice(0, 5).map((order: any) => {
              const company = COMPANIES.find(c => c.symbol === order.symbol);
              return (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${order.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {order.side}
                    </span>
                    <CompanyLogo symbol={order.symbol} sector={company?.sector} size={36} />
                    <div>
                      <p className="font-semibold text-gray-900">{order.symbol}</p>
                      <p className="text-xs text-gray-500">{order.quantity} shares @ ₹{fmt(Number(order.entryPrice))}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{fmt(Number(order.quantity) * Number(order.entryPrice))}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sector Tabs */}
      <div className="px-3 sm:px-6 mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {SECTORS.map(sector => (
          <button
            key={sector}
            onClick={() => setSelectedSector(sector)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSector === sector
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Company Cards Grid */}
      <div className="px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {selectedSector === 'All' ? 'All Stocks' : `${selectedSector} Sector`}
            <span className="text-sm font-normal text-gray-500 ml-2">({filteredCompanies.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredCompanies.map((company) => {
            const q = quotes[company.symbol];
            const isUp = (q?.percentage ?? 0) >= 0;
            return (
              <button
                key={company.symbol}
                onClick={() => handleStockClick(company.symbol)}
                className="bg-white border rounded-xl p-4 hover:shadow-lg hover:border-blue-200 transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <CompanyLogo symbol={company.symbol} sector={company.sector} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{company.label}</p>
                    <p className="text-xs text-gray-400">{company.symbol}</p>
                  </div>
                </div>
                {q ? (
                  <div className="mt-3">
                    <p className="text-lg font-bold text-gray-900">₹{fmt(q.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isUp ? '+' : ''}{q.percentage?.toFixed(2)}%
                      </span>
                    </div>
                    <span className={`text-xs ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                      ({isUp ? '+' : ''}₹{q.change?.toFixed(2)})
                    </span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mt-2" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stock Detail View ────────────────────────────────────────────────────────
function StockDetailView({
  symbol,
  quotes,
  onBack,
  onOrderPlaced
}: {
  symbol: string;
  quotes: Record<string, any>;
  onBack: () => void;
  onOrderPlaced?: () => void;
}) {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('1D');
  const [tradeSide, setTradeSide] = useState<'BUY' | 'SELL' | null>(null);
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [price, setPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [triggerPrice, setTriggerPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const q = quotes[symbol];
  const isUp = (q?.percentage ?? 0) >= 0;
  const isIndex = INDICES.some(i => i.symbol === symbol);
  const stockName = COMPANIES.find(c => c.symbol === symbol)?.label ||
                    INDICES.find(i => i.symbol === symbol)?.label ||
                    symbol;

  useEffect(() => {
    if (q?.price) {
      setPrice(q.price);
    }
  }, [q?.price]);

  const handleTrade = async () => {
    if (!tradeSide || qty < 1) return;
    setLoading(true);
    setMessage('');
    try {
      const execPrice = orderType === 'MARKET' ? q?.price : price;
      await ordersApi.place({
        symbol: symbol.replace(/^(NSE:|BSE:)/, ''),
        side: tradeSide,
        orderType,
        quantity: qty,
        entryPrice: execPrice,
        stopLoss: stopLoss || undefined,
        triggerPrice: triggerPrice || undefined,
      });
      setMessage(`✓ ${tradeSide} order placed successfully!`);
      onOrderPlaced?.();
      setTimeout(() => {
        setTradeSide(null);
        setMessage('');
        setQty(1);
        setStopLoss(null);
        setTriggerPrice(null);
      }, 2000);
    } catch (e: any) {
      setMessage(e.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = qty * (orderType === 'MARKET' ? (q?.price ?? 0) : price);

  return (
    <div className="flex flex-col bg-white min-h-screen w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{stockName}</h1>
              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                isIndex ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isIndex ? 'INDEX' : 'NSE'}
              </span>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            {q && (
              <div className="flex items-baseline gap-2 sm:gap-4 mt-1 sm:mt-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{fmt(q.price)}</span>
                <span className={`text-sm sm:text-lg font-semibold flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {isUp ? '+' : ''}₹{q.change?.toFixed(2)} ({isUp ? '+' : ''}{q.percentage?.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Option Chain Button for F&O Indices - Navigate to dedicated page */}
            {isIndex && FO_INDICES.includes(symbol) && (
              <button
                onClick={() => navigate(`/Home/options/${symbol}`)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold rounded-lg transition-colors bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md"
              >
                Option Chain
              </button>
            )}
            {!isIndex && (
              <>
                <button
                  onClick={() => navigate(`/Home/sell/${symbol.replace(/^(NSE:|BSE:)/, '')}`)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 font-semibold rounded-lg transition-colors bg-red-100 text-red-600 hover:bg-red-200 text-sm sm:text-base"
                >
                  Sell
                </button>
                <button
                  onClick={() => setTradeSide('BUY')}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 font-semibold rounded-lg transition-colors text-sm sm:text-base ${
                    tradeSide === 'BUY' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Buy
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start gap-6 lg:gap-4 overflow-hidden">
        {/* Main Chart Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b bg-gray-50 overflow-x-auto">
            {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-white hover:shadow'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 p-2 sm:p-4">
            <div className="h-full w-full min-h-[280px] sm:min-h-[400px] rounded-lg overflow-hidden border">
              <ChartErrorBoundary>
                <CandlestickChart 
                  symbol={symbol} 
                  range={timeframe} 
                  height={400} 
                  livePrice={q?.price}
                  onFullscreen={() => navigate('/Home/trade/fullscreen', { state: { symbol, timeframe } })}
                />
              </ChartErrorBoundary>
            </div>
          </div>

          {/* Stats Grid */}
          {q && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Market Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                {[
                  { label: 'Open', value: `₹${fmt(q.open)}` },
                  { label: 'High', value: `₹${fmt(q.high)}`, color: 'text-green-600' },
                  { label: 'Low', value: `₹${fmt(q.low)}`, color: 'text-red-500' },
                  { label: 'Prev Close', value: `₹${fmt(q.prevClose)}` },
                  { label: '52W High', value: `₹${fmt(q.week52High)}`, color: 'text-green-600' },
                  { label: '52W Low', value: `₹${fmt(q.week52Low)}`, color: 'text-red-500' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className={`text-sm font-semibold mt-1 ${stat.color || 'text-gray-900'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Trade Form */}
        {tradeSide && !isIndex && (
          <div className="w-full lg:w-[360px] lg:min-w-[320px] border-t lg:border-t-0 lg:border-l bg-gray-50 p-3 sm:p-6 overflow-visible lg:overflow-y-auto">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${tradeSide === 'BUY' ? 'text-green-700' : 'text-red-600'}`}>
                  {tradeSide === 'BUY' ? '📈 Buy' : '📉 Sell'} {symbol}
                </h3>
                <button
                  onClick={() => setTradeSide(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>

              {/* Order Type Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
                {(['MARKET', 'LIMIT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      orderType === type ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <label className="text-xs text-gray-500 block mb-2">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, +e.target.value))}
                    className="flex-1 px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <label className="text-xs text-gray-500 block mb-2">
                  {orderType === 'MARKET' ? 'Market Price (Live)' : 'Limit Price'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    step="0.05"
                    value={orderType === 'MARKET' ? (q?.price ?? 0) : price}
                    readOnly={orderType === 'MARKET'}
                    onChange={(e) => setPrice(+e.target.value)}
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg outline-none font-semibold ${
                      orderType === 'MARKET' ? 'bg-gray-50 text-gray-600' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Stop Loss & Trigger Price */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs text-gray-500 block mb-2">Stop Loss</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      step="0.05"
                      value={stopLoss ?? ''}
                      onChange={(e) => setStopLoss(e.target.value ? +e.target.value : null)}
                      placeholder="Optional"
                      className="w-full pl-7 pr-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-2">Trigger Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      step="0.05"
                      value={triggerPrice ?? ''}
                      onChange={(e) => setTriggerPrice(e.target.value ? +e.target.value : null)}
                      placeholder="Optional"
                      className="w-full pl-7 pr-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className={`rounded-xl p-4 mb-5 ${tradeSide === 'BUY' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <span className="text-sm font-semibold">{qty} shares</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Price per share</span>
                  <span className="text-sm font-semibold">₹{fmt(orderType === 'MARKET' ? (q?.price ?? 0) : price)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-current/20">
                  <span className="font-semibold">Total Value</span>
                  <span className="text-lg font-bold">₹{fmt(totalValue)}</span>
                </div>
              </div>

              {message && (
                <p className={`text-sm font-medium mb-4 text-center p-2 rounded-lg ${message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {message}
                </p>
              )}

              {/* Action Button */}
              <button
                onClick={handleTrade}
                disabled={loading || qty < 1}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all disabled:opacity-50 ${
                  tradeSide === 'BUY'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `${tradeSide} ${qty} ${qty === 1 ? 'Share' : 'Shares'}`
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                Paper trading • No real money involved
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
