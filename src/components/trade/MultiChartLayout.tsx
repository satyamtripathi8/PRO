import { useState, useId, useMemo } from 'react';
import { Plus, X, LayoutGrid, LayoutPanelLeft } from 'lucide-react';
import ProTradingChart from './ProTradingChart';
import MiniOptionChain from './MiniOptionChain';
import ChartErrorBoundary from './ChartErrorBoundary';
import { useMarketData } from '../../hooks/useMarketData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartTab {
  id: string;
  symbol: string;
  timeframe: string;
}

interface Props {
  initialSymbol?: string;
  initialTimeframe?: string;
}

// ─── Symbol quick-change input ────────────────────────────────────────────────

function SymbolInput({
  value, onChange,
}: {
  value: string; onChange: (sym: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const sym = draft.trim().toUpperCase().replace(/^(NSE:|BSE:)/, '');
    if (sym) onChange(sym);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-28 px-2 py-1 bg-white border border-blue-500 rounded text-gray-900 text-xs outline-none"
        placeholder="Symbol…"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-xs font-bold text-gray-700 hover:text-gray-900 hover:underline"
      title="Click to change symbol"
    >
      {value}
    </button>
  );
}

// ─── Main MultiChartLayout ────────────────────────────────────────────────────

export default function MultiChartLayout({
  initialSymbol = 'NIFTY50',
  initialTimeframe = '1D',
}: Props) {
  const uid = useId();
  const mkId = () => `${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Option chain panel state — { symbol, spotPrice } when open, null when closed
  const [optChain, setOptChain] = useState<{ symbol: string; spotPrice: number } | null>(null);

  const [tabs, setTabs] = useState<ChartTab[]>([
    { id: mkId(), symbol: initialSymbol, timeframe: initialTimeframe },
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [splitMode, setSplitMode] = useState(false);  // true = 2-chart side by side

  const MAX_TABS = 4;

  // ── Single shared WS connection for ALL tabs (no per-chart connections)
  const allSymbols = useMemo(() => tabs.map(t => t.symbol), [tabs]);
  const { quotes, isWebSocket } = useMarketData(allSymbols);

  const addTab = () => {
    if (tabs.length >= MAX_TABS) return;
    const newTab: ChartTab = { id: mkId(), symbol: 'NIFTY50', timeframe: '1D' };
    setTabs(t => [...t, newTab]);
    setActiveTab(tabs.length);
    setSplitMode(false);
  };

  const closeTab = (idx: number) => {
    if (tabs.length === 1) return;
    setTabs(t => t.filter((_, i) => i !== idx));
    setActiveTab(prev => Math.min(prev, tabs.length - 2));
    setSplitMode(false);
  };

  const updateTab = (idx: number, patch: Partial<ChartTab>) => {
    setTabs(t => t.map((tab, i) => i === idx ? { ...tab, ...patch } : tab));
  };

  const toggleSplit = () => {
    if (tabs.length < 2 && !splitMode) {
      // Auto-add a second tab before splitting
      const newTab: ChartTab = { id: mkId(), symbol: 'BANKNIFTY', timeframe: '1D' };
      setTabs(t => [...t, newTab]);
    }
    setSplitMode(s => !s);
  };

  // Which tabs are visible
  const visibleTabs = splitMode
    ? [tabs[activeTab], tabs[activeTab + 1] ?? tabs[0]].filter(Boolean)
    : [tabs[activeTab]];

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ══ Tab bar ══ */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto scrollbar-hide">

        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg cursor-pointer border-b-2 transition-colors flex-shrink-0 ${
              activeTab === idx
                ? 'bg-white border-blue-500 text-gray-900'
                : 'bg-gray-100 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => { setActiveTab(idx); setSplitMode(false); }}
          >
            <span className="text-xs font-semibold">{tab.symbol}</span>
            <span className={`text-[10px] ${activeTab === idx ? 'text-blue-500' : 'text-gray-400'}`}>{tab.timeframe}</span>
            {tabs.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); closeTab(idx); }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {/* Add chart button */}
        {tabs.length < MAX_TABS && (
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0 ml-1"
            title="Add chart"
          >
            <Plus size={12} />
            <span className="text-xs">Add</span>
          </button>
        )}

        <div className="flex-1" />

        {/* Single shared WS status indicator */}
        <div className="flex items-center gap-1.5 text-[10px] px-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isWebSocket ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className={isWebSocket ? 'text-emerald-500' : 'text-yellow-500'}>
            {isWebSocket ? 'Live' : 'Polling'}
          </span>
        </div>

        {/* Layout toggle */}
        <div className="flex items-center gap-1 border-l border-gray-200 pl-3 ml-2">
          <button
            onClick={() => setSplitMode(false)}
            title="Single chart"
            className={`p-1.5 rounded transition-colors ${
              !splitMode ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <LayoutPanelLeft size={13} />
          </button>
          <button
            onClick={toggleSplit}
            title="Split view (2 charts)"
            className={`p-1.5 rounded transition-colors ${
              splitMode ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* ══ Chart area ══ */}
      <div className={`flex-1 flex ${splitMode ? 'flex-row gap-0' : 'flex-col'} overflow-y-auto`}>
        {visibleTabs.map((tab) => {
          const tabIdx = tabs.indexOf(tab);
          const chainOpen = !!(optChain && optChain.symbol === tab.symbol);
          // Shrink chart height when option chain panel is open so both fit without clipping
          const chartHeight = splitMode
            ? (chainOpen ? 280 : 400)
            : (chainOpen ? 320 : 480);
          return (
            <div
              key={tab.id}
              className={`flex flex-col ${
                splitMode ? 'flex-1 border-r border-gray-200 last:border-r-0' : ''
              }`}
            >
              {/* Per-chart symbol bar */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                <SymbolInput
                  value={tab.symbol}
                  onChange={sym => updateTab(tabIdx, { symbol: sym })}
                />
              </div>

              {/* Chart */}
              <div className="p-0">
                <ChartErrorBoundary>
                  <ProTradingChart
                    symbol={tab.symbol}
                    range={tab.timeframe}
                    height={chartHeight}
                    livePrice={quotes[tab.symbol]?.price}
                    showTradePanel={true}
                    onOptionsClick={(sym, spot) => setOptChain({ symbol: sym, spotPrice: spot })}
                    onRangeChange={tf => updateTab(tabIdx, { timeframe: tf })}
                  />
                </ChartErrorBoundary>
              </div>

              {/* Inline Option Chain panel */}
              {chainOpen && (
                <div className="h-72 border-t border-gray-200 flex-shrink-0">
                  <MiniOptionChain
                    symbol={optChain!.symbol}
                    initialSpot={optChain!.spotPrice}
                    onClose={() => setOptChain(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
