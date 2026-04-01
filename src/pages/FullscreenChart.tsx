import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, Download, Share2, ExternalLink, Pencil } from 'lucide-react';
import CandlestickChart from '../components/trade/CandlestickChart';
import ChartErrorBoundary from '../components/trade/ChartErrorBoundary';
import ChartDrawingOverlay from '../components/trade/ChartDrawingOverlay';
import BackButton from '../components/common/BackButton';
import FloatingTradePanel from '../components/trade/FloatingTradePanel';
import { walletApi } from '../lib/api';
import { useMarketData } from '../hooks/useMarketData';
import { showToastGlobal } from '../hooks/useToast';

// F&O indices that can trade options
const FO_INDICES = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];
const INDEX_SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX', 'NIFTYIT', 'MIDCAP'];

interface FullscreenChartState {
  symbol: string;
  timeframe: string;
}

export default function FullscreenChart() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [symbol, setSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [holdings, setHoldings] = useState<any[]>([]);
  const [showDrawing, setShowDrawing] = useState(false);
  const [chartCoords, setChartCoords] = useState<{
    priceToCoor: (price: number) => number | null;
    coorToPrice: (y: number) => number | null;
  } | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [chartHeight, setChartHeight] = useState(600);

  // Initialize from location state or query params
  useEffect(() => {
    const state = location.state as FullscreenChartState;
    const paramSymbol = searchParams.get('symbol');
    const paramTimeframe = searchParams.get('timeframe') || '1D';

    if (state?.symbol) {
      setSymbol(state.symbol);
      setTimeframe(state.timeframe || '1D');
    } else if (paramSymbol) {
      setSymbol(paramSymbol);
      setTimeframe(paramTimeframe);
    } else {
      // Fallback to NIFTY50
      setSymbol('NIFTY50');
      setTimeframe('1D');
    }
  }, [location.state, searchParams]);

  // Update URL params whenever symbol or timeframe changes
  useEffect(() => {
    if (symbol) {
      setSearchParams({ symbol, timeframe });
      document.title = `${symbol} Chart — Trevoros`;
    }
    return () => { document.title = 'Trevoros'; };
  }, [symbol, timeframe, setSearchParams]);

  // Fetch holdings for P&L overlay
  useEffect(() => {
    walletApi.getHoldings()
      .then(res => setHoldings(res.data ?? []))
      .catch(() => {});
  }, []);

  // Dynamic chart height based on window size
  useEffect(() => {
    const updateHeight = () => {
      // Header ~60px, footer ~32px, padding ~16px
      const h = window.innerHeight - 108;
      setChartHeight(Math.max(300, h));
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Track chart container dimensions for drawing overlay
  useEffect(() => {
    const el = chartWrapperRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setChartDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Get live price for the symbol
  const { quotes } = useMarketData(symbol ? [symbol] : []);
  const currentPrice = quotes[symbol]?.price ?? 0;

  // P&L data from holdings
  const holding = holdings.find((h: any) => (h.symbol || '').toUpperCase() === symbol.toUpperCase());
  const entryPrice = holding ? Number(holding.avgPrice) : undefined;
  const holdingQty = holding ? Number(holding.quantity) : undefined;

  const isIndex = INDEX_SYMBOLS.includes(symbol);
  const isFOIndex = FO_INDICES.includes(symbol);

  // Smart close: if new tab (no history), go to dashboard
  const handleClose = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/Home', { replace: true });
    }
  };

  const handleDownload = () => {
    showToastGlobal('Chart download feature coming soon', 'info');
  };

  const handleShare = () => {
    const url = `${window.location.origin}${location.pathname}?symbol=${symbol}&timeframe=${timeframe}`;
    navigator.clipboard.writeText(url);
    showToastGlobal('Chart link copied to clipboard!', 'success');
  };

  const handleDrawingSLChange = useCallback((price: number | null) => {
    if (price !== null && price > 0) {
      showToastGlobal(`Stop-loss set at ₹${price.toFixed(2)}`, 'info');
    }
  }, []);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDrawing) {
          setShowDrawing(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showDrawing]); // eslint-disable-line react-hooks/exhaustive-deps

  const timeframes = ['1M', '5M', '15M', '1H', '1D', '1W', '1Mo'];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
          <BackButton fallbackPath="/Home" className="text-gray-300 hover:text-white hover:bg-gray-800" />
          <h1 className="text-white text-base sm:text-xl font-bold whitespace-nowrap">{symbol}</h1>
          <div className="flex gap-1 sm:gap-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Drawing tools toggle */}
          <button
            onClick={() => setShowDrawing(!showDrawing)}
            className={`p-2 rounded-lg transition-colors ${
              showDrawing
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Drawing tools (D)"
          >
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Option Chain for F&O */}
          {isFOIndex && (
            <button
              onClick={() => navigate(`/Home/options/${symbol}`)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Option Chain
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Download chart"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Share chart"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => {}}
            className="hidden sm:block p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Open in new tab */}
          <button
            onClick={() => window.open(`/Home/trade/fullscreen?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`, '_blank')}
            className="hidden sm:block p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div ref={chartWrapperRef} className="flex-1 overflow-hidden bg-black p-2 sm:p-4 relative">
        <ChartErrorBoundary>
          <CandlestickChart
            symbol={symbol}
            range={timeframe}
            height={chartHeight}
            entryPrice={entryPrice}
            holdingQty={holdingQty}
            onChartReady={setChartCoords}
          />
        </ChartErrorBoundary>
        {showDrawing && chartCoords && chartDimensions.width > 0 && (
          <ChartDrawingOverlay
            symbol={symbol}
            width={chartDimensions.width}
            height={chartDimensions.height}
            priceToCoor={chartCoords.priceToCoor}
            coorToPrice={chartCoords.coorToPrice}
            visible={showDrawing}
            onClose={() => setShowDrawing(false)}
            onStopLossChange={handleDrawingSLChange}
          />
        )}
      </div>

      {/* Floating Trade Panel */}
      {symbol && (
        <FloatingTradePanel
          symbol={symbol}
          currentPrice={currentPrice}
          isIndex={isIndex}
          onNavigateOptions={isFOIndex ? () => navigate(`/Home/options/${symbol}`) : undefined}
        />
      )}

      {/* Keyboard shortcut hint */}
      <div className="bg-gray-900 border-t border-gray-800 px-3 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-xs text-gray-500">
        Press <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">ESC</kbd> to exit fullscreen
        {showDrawing && (
          <span className="ml-3">
            • <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">D</kbd> drawing mode active
          </span>
        )}
      </div>
    </div>
  );
}
