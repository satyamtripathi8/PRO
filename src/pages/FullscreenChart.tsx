import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { X, Settings, Download, Share2, Maximize2 } from 'lucide-react';
import CandlestickChart from '../components/trade/CandlestickChart';
import ChartErrorBoundary from '../components/trade/ChartErrorBoundary';

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
    }
  }, [symbol, timeframe, setSearchParams]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    // Placeholder for chart download functionality
    alert('Chart download feature coming soon');
  };

  const handleShare = () => {
    const url = `${window.location.origin}${location.pathname}?symbol=${symbol}&timeframe=${timeframe}`;
    navigator.clipboard.writeText(url);
    alert('Chart link copied to clipboard!');
  };

  const timeframes = ['1M', '5M', '15M', '1H', '1D', '1W', '1Mo'];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-bold">{symbol}</h1>
          <div className="flex gap-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
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

        <div className="flex items-center gap-3">
          {/* Toolbar */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Download chart"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Share chart"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => {}}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300 ml-2"
            title="Exit fullscreen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden bg-black p-4">
        <ChartErrorBoundary>
          <CandlestickChart 
            symbol={symbol} 
            range={timeframe}
            height={typeof window !== 'undefined' ? window.innerHeight - 100 : 600}
          />
        </ChartErrorBoundary>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-2 text-xs text-gray-500">
        Press <kbd className="bg-gray-800 px-2 py-1 rounded">ESC</kbd> to exit fullscreen
      </div>
    </div>
  );
}
