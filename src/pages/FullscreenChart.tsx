import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ExternalLink } from 'lucide-react';
import MultiChartLayout from '../components/trade/MultiChartLayout';

interface RouteState {
  symbol?: string;
  timeframe?: string;
}

export default function FullscreenChart() {
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const [symbol,    setSymbol]    = useState('NIFTY50');
  const [timeframe, setTimeframe] = useState('1D');
  const [mounted,   setMounted]   = useState(false);

  // Resolve symbol + timeframe from router state or query params
  useEffect(() => {
    const state    = location.state as RouteState | undefined;
    const paramSym = searchParams.get('symbol');
    const paramTf  = searchParams.get('timeframe') ?? '1D';

    if (state?.symbol) {
      setSymbol(state.symbol);
      setTimeframe(state.timeframe ?? '1D');
    } else if (paramSym) {
      setSymbol(paramSym);
      setTimeframe(paramTf);
    }
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Open this chart in a brand-new browser tab (standalone, no sidebar)
  const openNewTab = () => {
    window.open(
      `/chart?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Don't render until we know the symbol (avoids flash with wrong default)
  if (!mounted) return null;

  // ── Render via portal to document.body so it sits above MainLayout's
  //    sidebar and topbar entirely (no z-index stacking-context fights)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0a1628]">

      {/* ── Slim header bar ── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#060e1a] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* TrevorOS brand mark */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-black leading-none">T</span>
            </div>
            <span className="text-slate-400 text-xs font-medium hidden sm:block">TrevorOS Pro Chart</span>
          </div>
          <span className="text-slate-700 text-xs hidden md:block">·  {symbol}  ·  {timeframe}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Open in new tab */}
          <button
            onClick={openNewTab}
            title="Open in new browser tab"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors text-xs"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:inline">New tab</span>
          </button>

          {/* ESC hint */}
          <span className="text-slate-600 text-[10px] hidden sm:flex items-center gap-1 px-2">
            <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">ESC</kbd>
            close
          </span>

          {/* Close button */}
          <button
            onClick={() => navigate(-1)}
            title="Close fullscreen (ESC)"
            className="p-2 rounded-lg text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Multi-chart body ── */}
      <div className="flex-1 overflow-hidden">
        <MultiChartLayout
          initialSymbol={symbol}
          initialTimeframe={timeframe}
        />
      </div>
    </div>,
    document.body
  );
}
