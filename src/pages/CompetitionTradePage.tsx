import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, X, RefreshCw,
  Package, BarChart2, Trophy, ChevronDown, Timer,
} from 'lucide-react';
import { competitionsApi, marketApi } from '../lib/api';
import { useMarketData } from '../hooks/useMarketData';
import ProTradingChart, { type OpenPosition } from '../components/trade/ProTradingChart';
import ChartErrorBoundary from '../components/trade/ChartErrorBoundary';

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtINR(val: number | string) {
  const n = Number(val);
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}


function fmtCountdown(ms: number): { text: string; urgent: boolean } {
  if (ms <= 0) return { text: 'Ended', urgent: true };
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return { text: `${d}d ${h % 24}h`, urgent: false };
  if (h > 0) return { text: `${h}h ${m % 60}m`, urgent: h < 2 };
  if (m > 0) return { text: `${m}m ${s % 60}s`, urgent: true };
  return { text: `${s}s`, urgent: true };
}

// ─── Sub-components ────────────────────────────────────────────────────────

function HoldingRow({
  holding, livePrice, onClose,
}: { holding: any; livePrice?: number; onClose: (symbol: string, qty: number, price: string) => void }) {
  const [exitPrice, setExitPrice] = useState('');
  const [open, setOpen]           = useState(false);
  const [closing, setClosing]     = useState(false);

  const avgP    = Number(holding.avgPrice);
  const qty     = Number(holding.quantity);
  const ltp     = livePrice ?? avgP;
  const unrealised = (ltp - avgP) * qty * (holding.side === 'SELL' ? -1 : 1);
  const pctChg     = avgP > 0 ? ((ltp - avgP) / avgP) * 100 * (holding.side === 'SELL' ? -1 : 1) : 0;
  const up         = unrealised >= 0;

  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded ${holding.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {holding.side}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-semibold">{holding.symbol}</span>
            <span className={`text-sm font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {up ? '+' : '-'}{fmtINR(unrealised)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-slate-500 text-xs">{qty} × avg {fmtINR(avgP)}</span>
            <span className={`text-xs ${up ? 'text-emerald-500' : 'text-red-500'}`}>
              {livePrice ? `LTP ${fmtINR(ltp)}` : 'No live data'} ({up ? '+' : ''}{pctChg.toFixed(2)}%)
            </span>
          </div>
        </div>
        <button
          onClick={() => { setOpen(!open); if (!open && ltp > 0) setExitPrice(ltp.toFixed(2)); }}
          className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors flex-shrink-0"
        >Close</button>
      </div>
      {open && (
        <div className="border-t border-slate-700 px-3 py-2.5 flex gap-2 items-center bg-slate-900/40">
          <div className="flex-1">
            <label className="text-slate-500 text-[10px] block mb-1">Exit Price</label>
            <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              placeholder="Exit price" />
          </div>
          <button disabled={!exitPrice || closing || Number(exitPrice) <= 0} onClick={async () => {
            setClosing(true);
            await onClose(holding.symbol, Number(holding.quantity), exitPrice);
            setClosing(false); setOpen(false);
          }} className="mt-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg">
            {closing ? '…' : 'Confirm'}
          </button>
          <button onClick={() => setOpen(false)} className="mt-4 text-slate-500 hover:text-white"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function CompetitionTradePage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [competition, setCompetition]   = useState<any>(null);
  const [portfolio, setPortfolio]       = useState<any>(null);
  const [orders, setOrders]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<'chart' | 'trade' | 'holdings' | 'orders'>('chart');
  const [chartSymbol, setChartSymbol]   = useState('NIFTY50');
  const [chartRange, setChartRange]     = useState('1D');
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [leaderboard, setLeaderboard]   = useState<any[]>([]);
  const [countdown, setCountdown]       = useState<{ text: string; urgent: boolean } | null>(null);

  // Order form
  const [symbol, setSymbol]             = useState('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [side, setSide]                 = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity]         = useState('');
  const [entryPrice, setEntryPrice]     = useState('');
  const [stopLoss, setStopLoss]         = useState('');
  const [placing, setPlacing]           = useState(false);
  const [placeMsg, setPlaceMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Live prices for holdings
  const holdingSymbols = (portfolio?.holdings ?? []).map((h: any) => h.symbol as string);
  const { quotes } = useMarketData(holdingSymbols);

  // Map competition holdings → chart positions so ProTradingChart shows them on the price line
  const chartPositions = (portfolio?.holdings ?? []).map((h: any) => ({
    id: h.id as string,
    side: 'BUY' as const,
    quantity: Number(h.quantity),
    entryPrice: Number(h.avgPrice),
    symbol: (h.symbol as string).replace(/^(NSE:|BSE:)/, ''),
  }));

  // Route quick-trade BUY/SELL from chart into competition API
  const handleChartOrderPlace = async (side: 'BUY' | 'SELL', qty: number, price: number, sym: string) => {
    if (!id) return;
    await competitionsApi.placeOrder(id, { symbol: sym, side, quantity: qty, entryPrice: price });
    await loadData(true);
  };

  // Route sell from chart floating P&L into competition API (SELL by quantity at given price)
  const handleChartPositionClose = async (
    pos: OpenPosition,
    qty: number,
    price: number
  ) => {
    if (!id) return;
    await competitionsApi.placeOrder(id, { symbol: pos.symbol, side: 'SELL', quantity: qty, entryPrice: price });
    await loadData(true);
  };

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const [portRes, ordersRes, compRes] = await Promise.all([
        competitionsApi.portfolio(id),
        competitionsApi.orders(id),
        silent ? Promise.resolve(null) : competitionsApi.get(id),
      ]);
      setPortfolio(portRes.data);
      setOrders(ordersRes.data ?? []);
      if (compRes) setCompetition(compRes.data);
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadData();
    // Poll portfolio every 10 s for live P&L updates
    pollRef.current = setInterval(() => loadData(true), 10_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  // Countdown ticker — updates every second
  useEffect(() => {
    if (!competition?.endTime) return;
    const tick = () => setCountdown(fmtCountdown(new Date(competition.endTime).getTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [competition?.endTime]);

  // Load + auto-refresh leaderboard when scoreboard is open (every 30 s)
  useEffect(() => {
    if (!showScoreboard || !id) return;
    const fetchLB = () =>
      competitionsApi.leaderboard(id).then(r => setLeaderboard(r.data?.participants ?? r.data ?? [])).catch(() => {});
    fetchLB();
    const t = setInterval(fetchLB, 30_000);
    return () => clearInterval(t);
  }, [showScoreboard, id]);

  // Symbol search
  useEffect(() => {
    if (!symbolSearch.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await marketApi.search(symbolSearch);
        setSearchResults((res as any).data?.slice(0, 6) ?? []);
      } catch { setSearchResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [symbolSearch]);

  // ── Order placement ───────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!id || !symbol) return;
    setPlacing(true); setPlaceMsg(null);
    try {
      await competitionsApi.placeOrder(id, {
        symbol, side, quantity: Number(quantity), entryPrice: Number(entryPrice),
        ...(stopLoss ? { stopLoss: Number(stopLoss) } : {}),
      });
      setPlaceMsg({ type: 'ok', text: `✓ ${side} ${quantity} × ${symbol} @ ₹${entryPrice}` });
      setSymbol(''); setSymbolSearch(''); setQuantity(''); setEntryPrice(''); setStopLoss('');
      setChartSymbol(symbol); // Switch chart to the traded symbol
      setTab('chart');
      await loadData(true);
      setTimeout(() => setPlaceMsg(null), 4000);
    } catch (e: any) {
      setPlaceMsg({ type: 'err', text: e.message ?? 'Order failed' });
    } finally { setPlacing(false); }
  };

  const handleCloseOrder = async (symbol: string, qty: number, exitPrice: string) => {
    if (!id) return;
    try {
      await competitionsApi.placeOrder(id, { symbol, side: 'SELL', quantity: qty, entryPrice: Number(exitPrice) });
      await loadData(true);
    } catch (e: any) { alert(e.message ?? 'Failed to close'); }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const pnl       = Number(portfolio?.totalPnL ?? 0);
  const balance   = Number(portfolio?.currentBalance ?? 0);
  const starting  = Number(portfolio?.startingBalance ?? balance);
  const returnPct = starting > 0 ? ((pnl / starting) * 100) : 0;
  const pnlUp     = pnl >= 0;

  // Live unrealised P&L from market data
  const liveUnrealised = (portfolio?.holdings ?? []).reduce((acc: number, h: any) => {
    const q   = quotes[h.symbol.toUpperCase()];
    const ltp = q?.price && q.price > 0 ? q.price : Number(h.avgPrice);
    const d   = (ltp - Number(h.avgPrice)) * Number(h.quantity) * (h.side === 'SELL' ? -1 : 1);
    return acc + d;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
          <p className="text-slate-500 text-sm">Loading competition…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex flex-col" style={{ height: '100dvh' }}>

      {/* ── Top Bar ── */}
      <div className="flex-shrink-0 border-b border-slate-700/60 px-3 py-2 flex items-center gap-2 bg-[#060e1a]">
        <button onClick={() => navigate(`/Home/competitions/${id}`)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Trophy size={13} className="text-yellow-400" />
            <span className="font-bold text-sm text-white truncate max-w-[140px]">
              {competition?.title ?? 'Competition Trading'}
            </span>
          </div>
        </div>

        {/* Countdown pill */}
        {countdown && competition?.status === 'ACTIVE' && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
            countdown.urgent
              ? 'bg-red-900/50 border-red-600/50 text-red-300 animate-pulse'
              : 'bg-slate-800 border-slate-600 text-slate-300'
          }`}>
            <Timer size={9} />
            {countdown.text}
          </div>
        )}

        {/* Live P&L pill */}
        {portfolio && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${pnlUp ? 'bg-emerald-900/40 border-emerald-600/40 text-emerald-400' : 'bg-red-900/40 border-red-600/40 text-red-400'}`}>
            {pnlUp ? '+' : '-'}{fmtINR(pnl)} ({pnlUp ? '+' : ''}{returnPct.toFixed(2)}%)
          </div>
        )}

        {/* Leaderboard toggle */}
        <button onClick={() => setShowScoreboard(s => !s)} title="Leaderboard"
          className="p-1.5 text-slate-400 hover:text-yellow-400 rounded-lg hover:bg-slate-800 transition-colors">
          <BarChart2 size={16} />
        </button>
        <button onClick={() => loadData()} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Stats bar ── */}
      {portfolio && (
        <div className="flex-shrink-0 grid grid-cols-4 gap-px bg-slate-700/30 border-b border-slate-700/50">
          {[
            { label: 'Balance', value: fmtINR(balance), color: 'text-sky-400' },
            { label: 'Realised P&L', value: `${pnl >= 0 ? '+' : ''}${fmtINR(pnl)}`, color: pnlUp ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Unrealised', value: `${liveUnrealised >= 0 ? '+' : ''}${fmtINR(liveUnrealised)}`, color: liveUnrealised >= 0 ? 'text-emerald-300' : 'text-red-300' },
            { label: 'Positions', value: String((portfolio?.holdings ?? []).length), color: 'text-slate-300' },
          ].map(s => (
            <div key={s.label} className="bg-[#0a1628] px-2 py-2 text-center">
              <div className={`text-xs font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex-shrink-0 flex border-b border-slate-700/50 bg-[#060e1a]">
        {([
          { key: 'chart',    label: 'Chart', Icon: BarChart2  },
          { key: 'trade',    label: 'Trade', Icon: TrendingUp },
          { key: 'holdings', label: `Positions (${(portfolio?.holdings ?? []).length})`, Icon: Package },
          { key: 'orders',   label: 'History', Icon: RefreshCw },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t.key ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <t.Icon size={11} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* Chart tab */}
        {tab === 'chart' && (
          <div className="h-full flex flex-col">
            {/* Symbol bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-[#0c1628] border-b border-slate-700/50">
              <ChartSymbolSearch symbol={chartSymbol} onSymbolChange={s => { setChartSymbol(s); setSymbol(s); }} />
              <button onClick={() => { setTab('trade'); setSymbol(chartSymbol); setSymbolSearch(chartSymbol); }}
                className="ml-auto flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors">
                Trade this
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChartErrorBoundary>
                <ProTradingChart
                  symbol={chartSymbol}
                  range={chartRange}
                  height={window.innerHeight - 200}
                  showTradePanel={true}
                  externalPositions={chartPositions}
                  onOrderPlace={handleChartOrderPlace}
                  onPositionClose={handleChartPositionClose}
                  onRangeChange={setChartRange}
                />
              </ChartErrorBoundary>
            </div>
          </div>
        )}

        {/* Trade tab */}
        {tab === 'trade' && (
          <div className="h-full overflow-auto p-3">
            <div className="max-w-sm mx-auto space-y-3">
              {/* Side toggle */}
              <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
                {(['BUY', 'SELL'] as const).map(s => (
                  <button key={s} onClick={() => setSide(s)}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      side === s
                        ? s === 'BUY' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-red-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}>
                    {s === 'BUY' ? <span className="flex items-center justify-center gap-1.5"><TrendingUp size={13} />BUY</span>
                      : <span className="flex items-center justify-center gap-1.5"><TrendingDown size={13} />SELL</span>}
                  </button>
                ))}
              </div>

              {/* Symbol search */}
              <div className="relative">
                <label className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">Symbol</label>
                <input type="text" placeholder="Search e.g. RELIANCE, TCS…"
                  value={symbolSearch}
                  onChange={e => { setSymbolSearch(e.target.value); setSymbol(''); }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {symbol && (
                  <div className="absolute right-3 top-8 text-sky-400 text-xs font-bold">{symbol} ✓</div>
                )}
                {searchResults.length > 0 && !symbol && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                    {searchResults.map((r: any) => {
                      const sym = r.symbol ?? r.trading_symbol ?? r.instrument_key;
                      return (
                        <button key={sym} className="w-full text-left px-4 py-2.5 hover:bg-slate-700 text-sm border-b border-slate-700/50 last:border-0 transition-colors"
                          onClick={() => { setSymbol(sym); setSymbolSearch(r.name ?? sym); setSearchResults([]); setChartSymbol(sym); }}>
                          <div className="text-white font-semibold">{sym}</div>
                          <div className="text-slate-500 text-xs">{r.name ?? r.exchange}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fields */}
              {[
                { label: 'Quantity', value: quantity, set: setQuantity, ph: '0', required: true },
                { label: 'Price (₹)', value: entryPrice, set: setEntryPrice, ph: '0.00', required: true },
                { label: 'Stop Loss (₹) — reference only', value: stopLoss, set: setStopLoss, ph: 'Optional' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-slate-500 text-[10px] block mb-1 uppercase tracking-wider">{f.label}</label>
                  <input type="number" placeholder={f.ph} value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500" />
                </div>
              ))}

              {/* Cost preview */}
              {quantity && entryPrice && (
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 flex justify-between text-sm">
                  <span className="text-slate-400">{side === 'BUY' ? 'Est. Cost' : 'Est. Proceeds'}</span>
                  <span className="text-white font-bold">{fmtINR(Number(quantity) * Number(entryPrice))}</span>
                </div>
              )}

              {placeMsg && (
                <div className={`text-sm rounded-xl p-3 border ${placeMsg.type === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {placeMsg.text}
                </div>
              )}

              <button disabled={placing || !symbol || !quantity || !entryPrice} onClick={handlePlaceOrder}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 shadow-lg ${side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}`}>
                {placing ? 'Placing…' : `Place ${side} Order`}
              </button>

              {/* Balance reminder */}
              {portfolio && (
                <div className="text-center text-xs text-slate-600">
                  Available balance: <span className="text-sky-400 font-semibold">{fmtINR(balance)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Holdings tab */}
        {tab === 'holdings' && (
          <div className="h-full overflow-auto p-3 space-y-2">
            {(portfolio?.holdings ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <Package size={36} className="mb-3 opacity-30" />
                <p className="text-sm">No open positions</p>
                <button onClick={() => setTab('trade')} className="mt-3 text-sky-400 text-sm hover:underline">Place a trade →</button>
              </div>
            ) : (
              <>
                {/* Live P&L total */}
                <div className={`rounded-xl p-3 text-center border ${liveUnrealised >= 0 ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Live Unrealised P&L</p>
                  <p className={`text-2xl font-bold ${liveUnrealised >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {liveUnrealised >= 0 ? '+' : '-'}{fmtINR(liveUnrealised)}
                  </p>
                </div>
                {(portfolio?.holdings ?? []).map((h: any) => (
                  <HoldingRow key={h.id} holding={h}
                    livePrice={quotes[h.symbol?.toUpperCase()]?.price}
                    onClose={handleCloseOrder} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Orders history tab */}
        {tab === 'orders' && (
          <div className="h-full overflow-auto p-3 space-y-2">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <Package size={36} className="mb-3 opacity-30" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              orders.map(o => {
                const oPnl = o.pnl ? Number(o.pnl) : null;
                return (
                  <div key={o.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${o.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{o.side}</span>
                        <span className="text-white text-sm font-semibold">{o.symbol}</span>
                      </div>
                      <span className="text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{Number(o.quantity)} × {fmtINR(o.entryPrice)}</span>
                      {oPnl !== null ? (
                        <span className={`font-bold ${oPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {oPnl >= 0 ? '+' : '-'}{fmtINR(oPnl)}
                        </span>
                      ) : (
                        <span className="text-sky-400/70 text-[10px]">OPEN</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Leaderboard slide-over ── */}
        {showScoreboard && (
          <div className="absolute inset-0 z-40 bg-[#0a1628]/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="font-bold">Leaderboard</span>
              </div>
              <button onClick={() => setShowScoreboard(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {leaderboard.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                  <RefreshCw size={14} className="animate-spin mr-2" /> Loading…
                </div>
              ) : (
                leaderboard.map((entry: any, i: number) => {
                  const entryPnl = Number(entry.totalPnL ?? 0);
                  return (
                    <div key={entry.userId ?? i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'border-yellow-500/40 bg-yellow-900/10' : 'border-slate-700/40 bg-slate-800/40'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{entry.user?.name ?? entry.userId ?? `Player ${i + 1}`}</div>
                        <div className="text-xs text-slate-500">{fmtINR(Number(entry.currentBalance ?? 0))} balance</div>
                      </div>
                      <div className={`text-sm font-bold ${entryPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entryPnl >= 0 ? '+' : '-'}{fmtINR(entryPnl)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline chart symbol search ────────────────────────────────────────────

function ChartSymbolSearch({ symbol, onSymbolChange }: { symbol: string; onSymbolChange: (s: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(symbol);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!draft.trim() || !editing) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await marketApi.search(draft); setResults((r as any).data?.slice(0, 5) ?? []); }
      catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [draft, editing]);

  if (!editing) {
    return (
      <button onClick={() => { setDraft(symbol); setEditing(true); }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-sm font-bold text-slate-200 hover:text-white hover:border-sky-500/50 transition-colors">
        {symbol}
        <ChevronDown size={11} className="text-slate-500" />
      </button>
    );
  }

  return (
    <div className="relative">
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { onSymbolChange(draft.trim().toUpperCase()); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
        onBlur={() => setTimeout(() => setEditing(false), 200)}
        className="w-36 px-3 py-1.5 bg-slate-900 border border-sky-500 rounded-lg text-white text-sm outline-none placeholder-slate-500"
        placeholder="Symbol…" />
      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {results.map((r: any) => {
            const sym = r.symbol ?? r.trading_symbol;
            return (
              <button key={sym} className="w-full text-left px-3 py-2 hover:bg-slate-700 text-xs border-b border-slate-700/50 last:border-0"
                onMouseDown={() => { onSymbolChange(sym); setEditing(false); setResults([]); }}>
                <div className="font-semibold text-white">{sym}</div>
                <div className="text-slate-500">{r.name}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
