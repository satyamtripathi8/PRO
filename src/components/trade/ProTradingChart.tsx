import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { marketApi, ordersApi } from '../../lib/api';
import { WS_BASE_URL } from '../../lib/config';
import { calcEMA, calcSMA, calcVWAP, calcRSI, calcMACD, type CandleData } from '../../lib/indicators';
import {
  RefreshCw, TrendingUp, Minus, AlignJustify,
  Crosshair, Eraser, Moon, Sun, ChevronDown, Check,
  Trash2, Copy, Palette, Lock, Unlock, ExternalLink,
  ZoomIn, ZoomOut,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type IndicatorKey = 'EMA9' | 'EMA21' | 'SMA50' | 'SMA200' | 'VWAP' | 'RSI' | 'MACD';
type DrawingMode  = 'none' | 'trendline' | 'hline' | 'fibonacci';
type DropdownKey  = 'timeframe' | 'indicators' | 'tools' | null;
type Handle       = 'p1' | 'p2' | 'body';

interface TrendlineShape {
  type: 'trendline'; id: string; color: string; locked: boolean; visible: boolean;
  p1: { time: Time; price: number }; p2: { time: Time; price: number };
}
interface HLineShape {
  type: 'hline'; id: string; color: string; locked: boolean; visible: boolean;
  price: number; label: string;
}
interface FibShape {
  type: 'fibonacci'; id: string; locked: boolean; visible: boolean;
  p1: { time: Time; price: number }; p2: { time: Time; price: number };
}
type DrawingShape = TrendlineShape | HLineShape | FibShape;

interface DragState {
  id: string;
  handle: Handle;
  startPx: { x: number; y: number };
  originalDrawing: DrawingShape;
}

interface CtxMenu { x: number; y: number; id: string }
interface DrawAnchor { x: number; y: number; time: Time | null; price: number | null }

export interface OpenPosition {
  id: string; side: 'BUY' | 'SELL'; quantity: number; entryPrice: number; symbol: string;
}

export interface ProTradingChartProps {
  symbol: string;
  range?: string;
  height?: number;
  livePrice?: number;
  showTradePanel?: boolean;
  onFullscreen?: () => void;
  onOptionsClick?: (symbol: string, spotPrice: number) => void;
  onRangeChange?: (range: string) => void;
  // Competition mode — when provided, bypasses ordersApi and routes trades externally
  externalPositions?: OpenPosition[];
  onOrderPlace?: (side: 'BUY' | 'SELL', qty: number, price: number, symbol: string) => Promise<void>;
  onPositionClose?: (pos: OpenPosition, qty: number, price: number) => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TIMEFRAMES = [
  { label: '1 Min',   value: '1m'  },
  { label: '5 Min',   value: '5m'  },
  { label: '15 Min',  value: '15m' },
  { label: '30 Min',  value: '30m' },
  { label: '1 Hour',  value: '1h'  },
  { label: '4 Hour',  value: '4h'  },
  { label: '1 Day',   value: '1D'  },
  { label: '1 Week',  value: '1W'  },
  { label: '1 Month', value: '1M'  },
  { label: '3 Month', value: '3M'  },
  { label: '6 Month', value: '6M'  },
  { label: '1 Year',  value: '1Y'  },
  { label: '5 Year',  value: '5Y'  },
];

const IND_COLORS: Record<IndicatorKey, string> = {
  EMA9: '#f97316', EMA21: '#3b82f6', SMA50: '#a855f7',
  SMA200: '#ec4899', VWAP: '#06b6d4', RSI: '#22c55e', MACD: '#f43f5e',
};

const IND_DESC: Record<IndicatorKey, string> = {
  EMA9: 'EMA 9', EMA21: 'EMA 21', SMA50: 'SMA 50', SMA200: 'SMA 200',
  VWAP: 'VWAP', RSI: 'RSI 14', MACD: 'MACD 12/26/9',
};

const FO_INDICES = ['NIFTY50', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'];
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
const FIB_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const DRAWING_COLORS = ['#fbbf24','#f97316','#ef4444','#ec4899','#a855f7','#3b82f6','#06b6d4','#22c55e','#ffffff'];
const SUB_KEYS = ['RSI_L','MACD_H','MACD_L','MACD_S'] as const;

const DARK = {
  bg: '#0f172a', toolbar: '#0c1628', grid: '#1e293b', border: '#334155',
  text: '#94a3b8', wrapper: 'bg-[#0f172a] border-slate-700',
  tb: 'bg-[#0c1628] border-slate-700',
  btn: 'text-slate-400 hover:bg-slate-700 hover:text-slate-200',
  lbl: 'text-slate-300', muted: 'text-slate-500',
  panel: 'bg-slate-800 border-slate-600 text-slate-200',
  sub: 'bg-[#0c1628] border-slate-700',
  dd: 'bg-[#0c1628] border-slate-600 shadow-xl shadow-black/40',
  ddi: 'hover:bg-slate-700 text-slate-300',
  dda: 'bg-blue-600/20 text-blue-400',
};
const LIGHT = {
  bg: '#ffffff', toolbar: '#f8fafc', grid: '#f1f5f9', border: '#e2e8f0',
  text: '#334155', wrapper: 'bg-white border-gray-200',
  tb: 'bg-gray-50 border-gray-200',
  btn: 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
  lbl: 'text-gray-700', muted: 'text-gray-400',
  panel: 'bg-white border-gray-200 text-gray-800',
  sub: 'bg-gray-50 border-gray-200',
  dd: 'bg-white border-gray-200 shadow-xl',
  ddi: 'hover:bg-gray-50 text-gray-700',
  dda: 'bg-blue-50 text-blue-600',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() { return `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }


// ─── Component ──────────────────────────────────────────────────────────────

export default function ProTradingChart({
  symbol, range = '1D', height = 500,
  livePrice, showTradePanel = true, onOptionsClick, onRangeChange,
  externalPositions, onOrderPlace, onPositionClose,
}: ProTradingChartProps) {

  // ── DOM refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const subContainerRef  = useRef<HTMLDivElement>(null);
  const svgRef           = useRef<SVGSVGElement>(null);
  const toolbarRef       = useRef<HTMLDivElement>(null);
  const dragRef          = useRef<DragState | null>(null);

  // ── Chart refs
  const mainChartRef = useRef<IChartApi | null>(null);
  const subChartRef  = useRef<IChartApi | null>(null);
  const candleSerRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volSerRef    = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indSerRef    = useRef<Map<string, ISeriesApi<any>>>(new Map());

  // ── Data refs
  const rawCandlesRef = useRef<CandleData[]>([]);
  const lastCandleRef = useRef<CandleData | null>(null);
  const initPriceRef  = useRef<number | null>(null);
  const wsRef         = useRef<WebSocket | null>(null);
  const mountedRef    = useRef(true);
  const rafRef        = useRef<number>(0);

  // ── State
  const [darkMode, setDarkMode]         = useState(false);
  const [currentRange, setCurrentRange] = useState(range);
  const [activeInds, setActiveInds]     = useState<Set<IndicatorKey>>(new Set());
  const [drawMode, setDrawMode]         = useState<DrawingMode>('none');
  const [drawings, setDrawings]         = useState<DrawingShape[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [ctxMenu, setCtxMenu]           = useState<CtxMenu | null>(null);
  const [colorPicker, setColorPicker]   = useState<{ id: string } | null>(null);
  const [anchor, setAnchor]             = useState<DrawAnchor | null>(null);
  const [mouseXY, setMouseXY]           = useState<{ x: number; y: number } | null>(null);
  const [vpKey, setVpKey]               = useState(0);
  const [positions, setPositions]       = useState<OpenPosition[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [retryCount, setRetryCount]     = useState(0);
  const [lastPrice, setLastPrice]       = useState<number | null>(null);
  const [priceChange, setPriceChange]   = useState<{ v: number; p: number } | null>(null);
  const [isLive, setIsLive]             = useState(false);
  const [dataLoaded, setDataLoaded]     = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [showPnL, setShowPnL]           = useState(true);

  // Quick-trade
  const [showQT, setShowQT]       = useState(false);
  const [qtSide, setQtSide]       = useState<'BUY' | 'SELL'>('BUY');
  const [qtQty, setQtQty]         = useState(1);
  const [qtLoading, setQtLoading] = useState(false);
  const [qtMsg, setQtMsg]         = useState('');

  // Sell-from-P&L panel
  const [sellModal, setSellModal] = useState<{ posId: string; qty: number; loading: boolean; err: string } | null>(null);

  // ── Sync range prop → internal
  useEffect(() => { setCurrentRange(range); }, [range]);

  // ── Derived
  const T          = darkMode ? DARK : LIGHT;
  const hasSubPane = activeInds.has('RSI') || activeInds.has('MACD');
  const subInd: 'RSI' | 'MACD' | null = activeInds.has('MACD') ? 'MACD' : activeInds.has('RSI') ? 'RSI' : null;
  const mainH      = hasSubPane ? height - 145 : height;
  const subH       = 130;
  const cleanSym   = symbol.replace(/^(NSE:|BSE:)/, '');
  const isFO       = FO_INDICES.includes(cleanSym);
  const canTrade   = showTradePanel && !isFO;
  const tfLabel    = TIMEFRAMES.find(t => t.value === currentRange)?.label ?? currentRange;
  const cur        = lastPrice ?? livePrice ?? 0;

  // ── Close dropdown/context-menu on outside click
  useEffect(() => {
    if (!openDropdown && !ctxMenu && !colorPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current && !toolbarRef.current.contains(target)) setOpenDropdown(null);
      setCtxMenu(null);
      setColorPicker(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown, ctxMenu, colorPicker]);

  // ── Delete key removes selected drawing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId &&
          !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setDrawings(d => d.filter(x => x.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === 'Escape') { setSelectedId(null); setCtxMenu(null); setColorPicker(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId]);

  // ── Chart theme
  const chartTheme = useCallback(() => ({
    layout: { background: { type: ColorType.Solid, color: T.bg }, textColor: T.text },
    grid:   { vertLines: { color: T.grid }, horzLines: { color: T.grid } },
    rightPriceScale: { borderColor: T.border },
    timeScale:       { borderColor: T.border },
  }), [T.bg, T.text, T.grid, T.border]);

  // ── Coordinate helpers
  const pixelToChart = useCallback((px: number, py: number) => {
    const chart = mainChartRef.current;
    const ser   = candleSerRef.current;
    if (!chart || !ser) return null;
    const time  = chart.timeScale().coordinateToTime(px);
    const price = ser.coordinateToPrice(py);
    if (time === null || price === null) return null;
    return { time, price };
  }, []);

  const chartToPixel = useCallback((time: Time, price: number) => {
    const chart = mainChartRef.current;
    const ser   = candleSerRef.current;
    if (!chart || !ser) return null;
    const x = chart.timeScale().timeToCoordinate(time);
    const y = ser.priceToCoordinate(price);
    if (x === null || y === null) return null;
    return { x, y };
  }, []);

  // ── Remove a series by key
  const removeSer = useCallback((key: string) => {
    const m = indSerRef.current;
    if (!m.has(key)) return;
    try {
      if ((SUB_KEYS as readonly string[]).includes(key)) subChartRef.current?.removeSeries(m.get(key)!);
      else mainChartRef.current?.removeSeries(m.get(key)!);
    } catch { /* gone */ }
    m.delete(key);
  }, []);

  // ── Apply overlay indicators
  const applyOverlays = useCallback((candles: CandleData[], inds: Set<IndicatorKey>) => {
    const chart = mainChartRef.current;
    if (!chart || candles.length === 0) return;
    const m = indSerRef.current;
    const ensure = (key: string, opts: any) => { if (!m.has(key)) m.set(key, chart.addSeries(LineSeries, opts)); };

    if (inds.has('EMA9'))   { ensure('EMA9',  { color: IND_COLORS.EMA9,  lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }); m.get('EMA9')!.setData(calcEMA(candles, 9) as any); }
    if (inds.has('EMA21'))  { ensure('EMA21', { color: IND_COLORS.EMA21, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }); m.get('EMA21')!.setData(calcEMA(candles, 21) as any); }
    if (inds.has('SMA50'))  { ensure('SMA50', { color: IND_COLORS.SMA50, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }); m.get('SMA50')!.setData(calcSMA(candles, 50) as any); }
    if (inds.has('SMA200')) { ensure('SMA200',{ color: IND_COLORS.SMA200,lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }); m.get('SMA200')!.setData(calcSMA(candles, 200) as any); }
    if (inds.has('VWAP'))   { ensure('VWAP',  { color: IND_COLORS.VWAP,  lineWidth: 1.5, lineStyle: 2, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }); m.get('VWAP')!.setData(calcVWAP(candles) as any); }
  }, []);

  // ── Apply sub-pane
  const applySubPane = useCallback((candles: CandleData[], ind: 'RSI' | 'MACD' | null) => {
    const sub = subChartRef.current;
    if (!sub || candles.length === 0 || !ind) return;
    const m = indSerRef.current;

    if (ind === 'RSI') {
      if (!m.has('RSI_L')) {
        const s = sub.addSeries(LineSeries, { color: IND_COLORS.RSI, lineWidth: 2, priceLineVisible: false });
        s.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OB' });
        s.createPriceLine({ price: 30, color: '#3b82f6', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'OS' });
        m.set('RSI_L', s);
      }
      m.get('RSI_L')!.setData(calcRSI(candles) as any);
    } else {
      const { macd, signal: sig, histogram } = calcMACD(candles);
      if (!m.has('MACD_H')) {
        m.set('MACD_H', sub.addSeries(HistogramSeries, { priceLineVisible: false }));
        m.set('MACD_L', sub.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2, priceLineVisible: false }));
        m.set('MACD_S', sub.addSeries(LineSeries, { color: '#f97316', lineWidth: 2, priceLineVisible: false }));
      }
      m.get('MACD_H')!.setData(histogram as any);
      m.get('MACD_L')!.setData(macd as any);
      m.get('MACD_S')!.setData(sig as any);
    }
  }, []);

  // ── Toggle indicator
  const toggleInd = useCallback((ind: IndicatorKey) => {
    setActiveInds(prev => {
      const next = new Set(prev);
      if (next.has(ind)) { next.delete(ind); if (ind !== 'RSI' && ind !== 'MACD') removeSer(ind); }
      else next.add(ind);
      return next;
    });
  }, [removeSer]);

  // ── Inject live tick
  const injectTick = useCallback((price: number) => {
    if (!candleSerRef.current || !lastCandleRef.current || price <= 0) return;
    const now      = Math.floor(Date.now() / 1000);
    const slotTime = Math.floor(now / 60) * 60;
    const prev     = lastCandleRef.current;
    const updated: CandleData = slotTime <= prev.time
      ? { ...prev, high: Math.max(prev.high, price), low: Math.min(prev.low, price), close: price }
      : { time: slotTime, open: price, high: price, low: price, close: price };
    lastCandleRef.current = updated;
    const raw = rawCandlesRef.current;
    if (raw.length && raw[raw.length - 1].time === updated.time) raw[raw.length - 1] = updated;
    try { candleSerRef.current.update(updated as any); } catch { /* noop */ }
    setLastPrice(price);
    if (initPriceRef.current) {
      const d = price - initPriceRef.current;
      setPriceChange({ v: d, p: (d / initPriceRef.current) * 100 });
    }
  }, []);

  // ── Main chart lifecycle
  useEffect(() => {
    if (!mainContainerRef.current) return;
    mountedRef.current = true;
    setDataLoaded(false);

    const chart = createChart(mainContainerRef.current, {
      ...chartTheme(),
      autoSize: true,
      height: mainH,
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: T.border, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: T.border, timeVisible: true, secondsVisible: false },
      handleScroll: { vertTouchDrag: false },
    });
    mainChartRef.current = chart;

    const candleSer = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    candleSerRef.current = candleSer;

    const volSer = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' });
    volSer.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volSerRef.current = volSer;

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setVpKey(k => k + 1));
    });

    setLoading(true); setError(null);
    marketApi.getHistory(symbol, currentRange)
      .then(res => {
        if (!mountedRef.current) return;
        const candles: CandleData[] = (res.data ?? []).map((c: any) => ({
          time: c.time, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume ?? 0,
        }));
        rawCandlesRef.current = candles;
        if (candles.length > 0) {
          candleSer.setData(candles as any);
          volSer.setData((res.data ?? []).map((c: any) => ({
            time: c.time, value: c.volume ?? 0,
            color: c.close >= c.open ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)',
          })) as any);
          lastCandleRef.current = candles[candles.length - 1];
          initPriceRef.current  = candles[0].open;
          setLastPrice(candles[candles.length - 1].close);
          const d = candles[candles.length - 1].close - candles[0].open;
          setPriceChange({ v: d, p: (d / candles[0].open) * 100 });
          chart.timeScale().fitContent();
          setDataLoaded(true);
          setActiveInds(prev => { applyOverlays(candles, prev); return prev; });
        } else {
          setError('Market data unavailable — market may be closed or symbol not found');
        }
      })
      .catch(e => { if (mountedRef.current) setError(e?.message ?? 'Failed to load'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });

    if (currentRange === '1D' && livePrice === undefined) {
      const connect = () => {
        if (!mountedRef.current) return;
        const ws = new WebSocket(WS_BASE_URL);
        wsRef.current = ws;
        ws.onopen  = () => { if (!mountedRef.current) { ws.close(); return; } ws.send(JSON.stringify({ type: 'subscribe', symbols: [symbol] })); setIsLive(true); };
        ws.onmessage = ev => { if (!mountedRef.current) return; try { const msg = JSON.parse(ev.data); if (msg.type === 'quote' && (msg.symbol === symbol || msg.data?.symbol === symbol)) { const p = msg.data?.price; if (p > 0) injectTick(p); } } catch { /* noop */ } };
        ws.onclose = () => { setIsLive(false); if (mountedRef.current) setTimeout(connect, 3000); };
        ws.onerror = () => ws.close();
      };
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      wsRef.current?.close(); wsRef.current = null;
      if (subChartRef.current) { try { subChartRef.current.remove(); } catch { /* noop */ } subChartRef.current = null; }
      SUB_KEYS.forEach(k => indSerRef.current.delete(k));
      chart.remove();
      mainChartRef.current = null; candleSerRef.current = null; volSerRef.current = null;
      indSerRef.current.clear(); rawCandlesRef.current = []; lastCandleRef.current = null;
    };
  }, [symbol, currentRange, mainH, retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sub-pane lifecycle
  useEffect(() => {
    if (subChartRef.current) { try { subChartRef.current.remove(); } catch { /* noop */ } subChartRef.current = null; SUB_KEYS.forEach(k => indSerRef.current.delete(k)); }
    if (!hasSubPane || !subContainerRef.current || !mainChartRef.current) return;

    const sub = createChart(subContainerRef.current, { ...chartTheme(), autoSize: true, height: subH, crosshair: { mode: 1 }, rightPriceScale: { borderColor: T.border, scaleMargins: { top: 0.1, bottom: 0.1 } }, timeScale: { borderColor: T.border, visible: false } });
    subChartRef.current = sub;
    const main = mainChartRef.current;
    let sA = false, sB = false;
    main.timeScale().subscribeVisibleLogicalRangeChange(r => { if (sB || !r) return; sA = true; sub.timeScale().setVisibleLogicalRange(r); sA = false; });
    sub.timeScale().subscribeVisibleLogicalRangeChange(r => { if (sA || !r) return; sB = true; main.timeScale().setVisibleLogicalRange(r); sB = false; });
    const vr = main.timeScale().getVisibleLogicalRange(); if (vr) sub.timeScale().setVisibleLogicalRange(vr);
    if (rawCandlesRef.current.length > 0) applySubPane(rawCandlesRef.current, subInd);

    return () => { if (subChartRef.current) { try { subChartRef.current.remove(); } catch { /* noop */ } subChartRef.current = null; } SUB_KEYS.forEach(k => indSerRef.current.delete(k)); };
  }, [hasSubPane, subInd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (dataLoaded && subChartRef.current && subInd) applySubPane(rawCandlesRef.current, subInd); }, [dataLoaded, subInd, applySubPane]);
  useEffect(() => { if (rawCandlesRef.current.length > 0) applyOverlays(rawCandlesRef.current, activeInds); }, [activeInds, applyOverlays]);
  useEffect(() => { if (livePrice !== undefined && livePrice > 0 && currentRange === '1D') injectTick(livePrice); }, [livePrice, currentRange, injectTick]);
  useEffect(() => { const opts = chartTheme(); mainChartRef.current?.applyOptions(opts); subChartRef.current?.applyOptions(opts); }, [darkMode, chartTheme]);

  // ── Fetch positions (or use externally-supplied ones in competition mode)
  useEffect(() => {
    const clean = symbol.replace(/^(NSE:|BSE:)/, '');
    if (externalPositions !== undefined) {
      // Competition mode: use the positions provided by the parent
      const filtered = externalPositions.filter(p => p.symbol.toUpperCase() === clean.toUpperCase());
      setPositions(filtered);
      filtered.forEach(pos => {
        if (!candleSerRef.current) return;
        try { candleSerRef.current.createPriceLine({ price: pos.entryPrice, color: pos.side === 'BUY' ? '#26a69a' : '#ef5350', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `${pos.side} ×${pos.quantity}` }); } catch { /* noop */ }
      });
      return;
    }
    ordersApi.list({ status: 'OPEN' })
      .then(res => {
        if (!mountedRef.current) return;
        const orders: OpenPosition[] = (res.data ?? [])
          .filter((o: any) => o.symbol === clean)
          .map((o: any) => ({ id: o.id, side: o.side, quantity: Number(o.quantity), entryPrice: Number(o.entryPrice), symbol: clean }));
        setPositions(orders);
        orders.forEach(pos => {
          if (!candleSerRef.current) return;
          try { candleSerRef.current.createPriceLine({ price: pos.entryPrice, color: pos.side === 'BUY' ? '#26a69a' : '#ef5350', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `${pos.side} ×${pos.quantity}` }); } catch { /* noop */ }
        });
      })
      .catch(() => { /* optional */ });
  }, [symbol, externalPositions]);

  // ─── Drawing mutation helpers ─────────────────────────────────────────────

  const updateDrawing = useCallback((id: string, patch: Partial<DrawingShape>) => {
    setDrawings(d => d.map(x => x.id === id ? { ...x, ...patch } as DrawingShape : x));
  }, []);

  const deleteDrawing = useCallback((id: string) => {
    setDrawings(d => d.filter(x => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateDrawing = useCallback((id: string) => {
    setDrawings(d => {
      const src = d.find(x => x.id === id);
      if (!src) return d;
      return [...d, { ...src, id: uid() }];
    });
  }, []);

  // ─── Drawing SVG mouse events ─────────────────────────────────────────────

  // Click on chart-area when NOT in draw mode → deselect
  const handleAreaClick = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    if (drawMode === 'none') setSelectedId(null);
  }, [drawMode]);

  // Mouse down on a drawing handle or body → start drag
  const handleDrawingMouseDown = useCallback((
    e: React.MouseEvent, id: string, handle: Handle
  ) => {
    e.stopPropagation();
    if (drawMode !== 'none') return; // don't drag while drawing
    const drawing = drawings.find(d => d.id === id);
    if (!drawing || drawing.locked) return;

    dragRef.current = {
      id, handle,
      startPx: { x: e.clientX, y: e.clientY },
      originalDrawing: JSON.parse(JSON.stringify(drawing)),
    };
    setSelectedId(id);
  }, [drawings, drawMode]);

  // SVG mouse move — update drag
  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = mainContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setMouseXY({ x: px, y: py });

    if (!dragRef.current) return;
    const { id, handle, startPx, originalDrawing } = dragRef.current;
    const newCoord = pixelToChart(px, py);
    if (!newCoord) return;

    if (originalDrawing.type === 'hline') {
      updateDrawing(id, { price: newCoord.price, label: newCoord.price.toFixed(2) } as any);
      return;
    }

    if (originalDrawing.type === 'trendline' || originalDrawing.type === 'fibonacci') {
      const orig = originalDrawing as TrendlineShape | FibShape;
      if (handle === 'p1') {
        updateDrawing(id, { p1: { time: newCoord.time, price: newCoord.price } } as any);
      } else if (handle === 'p2') {
        updateDrawing(id, { p2: { time: newCoord.time, price: newCoord.price } } as any);
      } else {
        // body move: translate both points by the same pixel delta
        const dx = e.clientX - startPx.x;
        const dy = e.clientY - startPx.y;
        const p1px = chartToPixel(orig.p1.time, orig.p1.price);
        const p2px = chartToPixel(orig.p2.time, orig.p2.price);
        if (!p1px || !p2px) return;
        const newP1 = pixelToChart(p1px.x + dx, p1px.y + dy);
        const newP2 = pixelToChart(p2px.x + dx, p2px.y + dy);
        if (newP1 && newP2) updateDrawing(id, { p1: { time: newP1.time, price: newP1.price }, p2: { time: newP2.time, price: newP2.price } } as any);
      }
    }
  }, [pixelToChart, chartToPixel, updateDrawing]);

  const handleSvgMouseUp = useCallback(() => { dragRef.current = null; }, []);

  // SVG click — create new drawing (only in draw mode)
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (drawMode === 'none') return;
    e.stopPropagation();
    const rect = mainContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const coord = pixelToChart(px, py);
    if (!coord) return;

    if (drawMode === 'hline') {
      setDrawings(d => [...d, { type: 'hline', id: uid(), color: '#fbbf24', locked: false, visible: true, price: coord.price, label: coord.price.toFixed(2) }]);
      return;
    }
    if (!anchor) {
      setAnchor({ x: px, y: py, time: coord.time, price: coord.price });
    } else {
      if (drawMode === 'trendline') {
        setDrawings(d => [...d, { type: 'trendline', id: uid(), color: '#fbbf24', locked: false, visible: true, p1: { time: anchor.time!, price: anchor.price! }, p2: { time: coord.time, price: coord.price } }]);
      } else {
        setDrawings(d => [...d, { type: 'fibonacci', id: uid(), locked: false, visible: true, p1: { time: anchor.time!, price: anchor.price! }, p2: { time: coord.time, price: coord.price } }]);
      }
      setAnchor(null);
    }
  }, [drawMode, anchor, pixelToChart]);

  // Right-click on a drawing
  const handleDrawingContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);
    setCtxMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  // ─── Quick-trade ──────────────────────────────────────────────────────────

  const placeTrade = async () => {
    setQtLoading(true); setQtMsg('');
    try {
      const execPrice = cur;
      if (onOrderPlace) {
        await onOrderPlace(qtSide, qtQty, execPrice, cleanSym);
        // externalPositions will be refreshed by the parent — no local state mutation needed
      } else {
        const orderRes = await ordersApi.place({ symbol: cleanSym, side: qtSide, orderType: 'MARKET', quantity: qtQty, entryPrice: execPrice });
        const realId = orderRes?.data?.id ?? `tmp_${Date.now()}`;
        const newPos: OpenPosition = { id: realId, side: qtSide, quantity: qtQty, entryPrice: execPrice, symbol: cleanSym };
        setPositions(p => [...p, newPos]);
      }
      setQtMsg(`✓ ${qtSide} ${qtQty} placed @ ₹${execPrice.toFixed(2)}`);
      setShowPnL(true);
      if (candleSerRef.current && execPrice > 0) {
        try { candleSerRef.current.createPriceLine({ price: execPrice, color: qtSide === 'BUY' ? '#26a69a' : '#ef5350', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: `${qtSide} ×${qtQty}` }); } catch { /* noop */ }
      }
      setTimeout(() => { setQtMsg(''); setShowQT(false); }, 2500);
    } catch (e: any) { setQtMsg(e.message ?? 'Order failed'); }
    finally { setQtLoading(false); }
  };

  // Sell from floating P&L panel — minimum 1 lot (= 1 quantity unit)
  const closePosMarket = async (pos: OpenPosition, lotsToSell: number) => {
    setSellModal(m => m ? { ...m, loading: true, err: '' } : m);
    try {
      if (onPositionClose) {
        await onPositionClose(pos, lotsToSell, cur);
        // externalPositions will be refreshed by the parent — no local state mutation needed
      } else {
        const isFullClose = lotsToSell >= pos.quantity;
        if (!pos.id.startsWith('tmp_')) {
          // Real order ID — use the close endpoint so PnL is recorded
          await ordersApi.close(pos.id, cur);
          if (!isFullClose) {
            // Partial close: reopen remaining lots at current price
            const remaining = pos.quantity - lotsToSell;
            const reopenRes = await ordersApi.place({ symbol: pos.symbol, side: pos.side, orderType: 'MARKET', quantity: remaining, entryPrice: cur });
            const newId = reopenRes?.data?.id ?? `tmp_${Date.now()}`;
            setPositions(p => p
              .filter(x => x.id !== pos.id)
              .concat({ ...pos, id: newId, quantity: remaining, entryPrice: cur })
            );
          } else {
            setPositions(p => p.filter(x => x.id !== pos.id));
          }
        } else {
          // Fallback for tmp positions (should not happen after ID fix)
          await ordersApi.place({ symbol: pos.symbol, side: pos.side === 'BUY' ? 'SELL' : 'BUY', orderType: 'MARKET', quantity: lotsToSell, entryPrice: cur });
          setPositions(p => {
            const idx = p.findIndex(x => x.id === pos.id);
            if (idx === -1) return p;
            const remaining = p[idx].quantity - lotsToSell;
            if (remaining <= 0) return p.filter(x => x.id !== pos.id);
            return p.map((x, i) => i === idx ? { ...x, quantity: remaining } : x);
          });
        }
      }
      setSellModal(null);
    } catch (e: any) {
      setSellModal(m => m ? { ...m, loading: false, err: e.message ?? 'Sell failed' } : m);
    }
  };

  // ─── SVG drawing renderer ─────────────────────────────────────────────────

  const renderDrawings = () => {
    const chart = mainChartRef.current;
    const ser   = candleSerRef.current;
    if (!chart || !ser) return null;
    const isDragging = !!dragRef.current;

    return drawings.filter(d => d.visible).map(d => {
      const isSelected = d.id === selectedId;
      const strokeW    = isSelected ? 2.5 : 1.5;
      const opacity    = isSelected ? 1.0 : 0.85;

      if (d.type === 'hline') {
        const y = ser.priceToCoordinate(d.price);
        if (y === null) return null;
        const labelW = d.label.length * 6.5 + 10;
        return (
          <g key={d.id} style={{ cursor: d.locked ? 'default' : 'ns-resize' }}>
            {/* Wide invisible hit area */}
            <line x1={0} y1={y} x2="100%" y2={y} stroke="transparent" strokeWidth={12}
              onMouseDown={e => handleDrawingMouseDown(e, d.id, 'body')}
              onContextMenu={e => handleDrawingContextMenu(e, d.id)}
              onClick={e => { e.stopPropagation(); setSelectedId(d.id); }}
            />
            {/* Visible line */}
            <line x1={0} y1={y} x2="100%" y2={y} stroke={d.color} strokeWidth={strokeW} strokeDasharray="6,4" opacity={opacity} pointerEvents="none" />
            {/* Label */}
            <rect x={4} y={y - 15} width={labelW} height={15} rx={3} fill={darkMode ? '#1e293b' : '#f1f5f9'} opacity={0.92} pointerEvents="none" />
            <text x={9} y={y - 4} fill={d.color} fontSize={10} fontFamily="monospace" fontWeight={isSelected ? '700' : '500'} pointerEvents="none">{d.label}</text>
            {/* Move handle */}
            {isSelected && !d.locked && (
              <circle cx={18} cy={y} r={5} fill={d.color} opacity={0.9}
                onMouseDown={e => handleDrawingMouseDown(e, d.id, 'body')}
                style={{ cursor: 'ns-resize' }} />
            )}
            {isSelected && (
              <rect x={0} y={y - 1} width="100%" height={2} stroke={d.color} strokeWidth={0.5} fill="none" strokeDasharray="3,3" opacity={0.4} pointerEvents="none" />
            )}
          </g>
        );
      }

      if (d.type === 'trendline') {
        const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
        const y1 = ser.priceToCoordinate(d.p1.price);
        const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
        const y2 = ser.priceToCoordinate(d.p2.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return (
          <g key={d.id}>
            {/* Hit area */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} strokeLinecap="round"
              onMouseDown={e => handleDrawingMouseDown(e, d.id, 'body')}
              onContextMenu={e => handleDrawingContextMenu(e, d.id)}
              onClick={e => { e.stopPropagation(); setSelectedId(d.id); }}
              style={{ cursor: d.locked ? 'default' : 'move' }}
            />
            {/* Visible line */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.color} strokeWidth={strokeW} strokeLinecap="round" opacity={opacity} pointerEvents="none" />
            {/* Endpoint handles */}
            {isSelected && !d.locked && !isDragging && (
              <>
                <circle cx={x1} cy={y1} r={6} fill={d.color} stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2}
                  onMouseDown={e => handleDrawingMouseDown(e, d.id, 'p1')} style={{ cursor: 'crosshair' }} />
                <circle cx={x2} cy={y2} r={6} fill={d.color} stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2}
                  onMouseDown={e => handleDrawingMouseDown(e, d.id, 'p2')} style={{ cursor: 'crosshair' }} />
                <circle cx={mx} cy={my} r={4} fill={d.color} opacity={0.6}
                  onMouseDown={e => handleDrawingMouseDown(e, d.id, 'body')} style={{ cursor: 'move' }} />
              </>
            )}
            {!isSelected && (
              <circle cx={x1} cy={y1} r={3.5} fill={d.color} opacity={0.7} pointerEvents="none" />
            )}
          </g>
        );
      }

      if (d.type === 'fibonacci') {
        const lo  = Math.min(d.p1.price, d.p2.price);
        const hi  = Math.max(d.p1.price, d.p2.price);
        const rng = hi - lo;
        const x1  = chart.timeScale().timeToCoordinate(d.p1.time);
        const x2  = chart.timeScale().timeToCoordinate(d.p2.time);
        if (x1 === null || x2 === null) return null;
        const xA = Math.min(x1, x2), xB = Math.max(x1, x2);
        const y1 = ser.priceToCoordinate(d.p1.price);
        const y2 = ser.priceToCoordinate(d.p2.price);
        if (y1 === null || y2 === null) return null;

        return (
          <g key={d.id}>
            {/* Shaded fill between 23.6% and 78.6% */}
            {(() => {
              const ya = ser.priceToCoordinate(lo + rng * 0.236);
              const yb = ser.priceToCoordinate(lo + rng * 0.764);
              if (ya === null || yb === null) return null;
              return <rect x={xA} y={Math.min(ya, yb)} width={xB - xA} height={Math.abs(ya - yb)} fill={isSelected ? '#3b82f620' : '#3b82f610'} pointerEvents="none" />;
            })()}
            {/* Hit area for body drag */}
            <rect x={xA} y={Math.min(y1, y2) - 5} width={xB - xA} height={Math.abs(y1 - y2) + 10} fill="transparent"
              onMouseDown={e => handleDrawingMouseDown(e, d.id, 'body')}
              onContextMenu={e => handleDrawingContextMenu(e, d.id)}
              onClick={e => { e.stopPropagation(); setSelectedId(d.id); }}
              style={{ cursor: d.locked ? 'default' : 'move' }}
            />
            {/* Fib level lines */}
            {FIB_LEVELS.map((lvl, i) => {
              const price = lo + rng * lvl;
              const y     = ser.priceToCoordinate(price);
              if (y === null) return null;
              const isKey = [0, 0.5, 1.0].includes(lvl);
              return (
                <g key={lvl} pointerEvents="none">
                  <line x1={xA} y1={y} x2={xB} y2={y} stroke={FIB_COLORS[i]} strokeWidth={isKey ? 1.5 : 1} strokeDasharray={isKey ? '0' : '4,3'} opacity={isSelected ? 0.95 : 0.75} />
                  <rect x={xA + 4} y={y - 13} width={74} height={13} rx={2} fill={darkMode ? '#0f172a' : '#ffffff'} opacity={0.85} />
                  <text x={xA + 7} y={y - 3} fill={FIB_COLORS[i]} fontSize={9} fontFamily="monospace" fontWeight="600">
                    {(lvl * 100).toFixed(1)}%  {price.toFixed(1)}
                  </text>
                </g>
              );
            })}
            {/* Endpoint handles when selected */}
            {isSelected && !d.locked && !isDragging && (
              <>
                <circle cx={x1} cy={y1} r={6} fill="#3b82f6" stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2}
                  onMouseDown={e => handleDrawingMouseDown(e, d.id, 'p1')} style={{ cursor: 'crosshair' }} />
                <circle cx={x2} cy={y2} r={6} fill="#3b82f6" stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2}
                  onMouseDown={e => handleDrawingMouseDown(e, d.id, 'p2')} style={{ cursor: 'crosshair' }} />
              </>
            )}
          </g>
        );
      }
      return null;
    });
  };

  const renderPreview = () => {
    if (!anchor || !mouseXY || drawMode === 'none') return null;
    const chart = mainChartRef.current; const ser = candleSerRef.current;
    if (!chart || !ser) return null;
    const ax = chart.timeScale().timeToCoordinate(anchor.time!);
    const ay = ser.priceToCoordinate(anchor.price!);
    if (ax === null || ay === null) return null;
    return <line x1={ax} y1={ay} x2={mouseXY.x} y2={mouseXY.y} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="5,3" opacity={0.7} pointerEvents="none" />;
  };

  // ─── Live P&L calculations ────────────────────────────────────────────────
  const totalPnL = positions.reduce((acc, pos) => {
    const d = pos.side === 'BUY' ? cur - pos.entryPrice : pos.entryPrice - cur;
    return acc + d * pos.quantity;
  }, 0);
  const isUp  = (priceChange?.v ?? 0) >= 0;
  const pnlUp = totalPnL >= 0;

  // ─── Toolbar helpers ──────────────────────────────────────────────────────
  const toggleDD = (key: DropdownKey) => setOpenDropdown(prev => (prev === key ? null : key));

  const TOOL_OPTIONS: { mode: DrawingMode; Icon: any; label: string; hint: string }[] = [
    { mode: 'none',      Icon: Crosshair,    label: 'Cursor / Pan',           hint: 'Normal chart interaction' },
    { mode: 'trendline', Icon: TrendingUp,   label: 'Trendline',              hint: '2 clicks to draw' },
    { mode: 'hline',     Icon: Minus,        label: 'Horizontal Line',        hint: '1 click to place' },
    { mode: 'fibonacci', Icon: AlignJustify, label: 'Fibonacci Retracement',  hint: '2 clicks to draw' },
  ];
  const activeTool = TOOL_OPTIONS.find(t => t.mode === drawMode)!;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`flex flex-col rounded-xl overflow-hidden border select-none ${T.wrapper}`}>

      {/* ══ Toolbar ══ */}
      <div ref={toolbarRef} className={`flex items-center gap-1.5 px-3 py-1.5 border-b flex-wrap ${T.tb}`}>
        {/* Price */}
        <div className="flex items-center gap-2 flex-shrink-0 mr-1">
          <span className={`text-xs font-bold tracking-wide ${T.lbl}`}>{cleanSym}</span>
          {lastPrice !== null && (
            <>
              <span className={`font-bold text-sm ${T.lbl}`}>₹{lastPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              {priceChange && (
                <span className={`text-xs font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isUp ? '+' : ''}{priceChange.v.toFixed(2)} ({isUp ? '+' : ''}{priceChange.p.toFixed(2)}%)
                </span>
              )}
            </>
          )}
          {currentRange === '1D' && (
            <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${isLive || livePrice ? (darkMode ? 'bg-emerald-900/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-gray-100 text-gray-400')}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive || livePrice ? 'bg-emerald-500 animate-pulse' : darkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />
              {isLive || livePrice ? 'Live' : 'Delayed'}
            </span>
          )}
          {loading && <RefreshCw size={11} className="text-blue-500 animate-spin" />}
        </div>

        <div className="flex-1" />

        {/* Timeframe */}
        <div className="relative">
          <button onClick={() => toggleDD('timeframe')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors border ${openDropdown === 'timeframe' ? 'bg-blue-600 text-white border-blue-600' : `border-transparent ${T.btn}`}`}>
            {tfLabel}<ChevronDown size={10} />
          </button>
          {openDropdown === 'timeframe' && (
            <div className={`absolute top-full mt-1 right-0 z-50 w-32 rounded-xl border overflow-hidden ${T.dd}`}>
              {TIMEFRAMES.map(tf => (
                <button key={tf.value} onClick={() => { setCurrentRange(tf.value); onRangeChange?.(tf.value); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${currentRange === tf.value ? T.dda : T.ddi}`}>
                  <span>{tf.label}</span>
                  {currentRange === tf.value && <Check size={9} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicators */}
        <div className="relative">
          <button onClick={() => toggleDD('indicators')} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors border ${activeInds.size > 0 ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : `border-transparent ${T.btn}`}`}>
            Indicators{activeInds.size > 0 ? ` (${activeInds.size})` : ''}<ChevronDown size={10} />
          </button>
          {openDropdown === 'indicators' && (
            <div className={`absolute top-full mt-1 right-0 z-50 w-44 rounded-xl border overflow-hidden ${T.dd}`}>
              {(Object.keys(IND_COLORS) as IndicatorKey[]).map(ind => {
                const on = activeInds.has(ind);
                return (
                  <button key={ind} onClick={() => toggleInd(ind)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${on ? T.dda : T.ddi}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: IND_COLORS[ind] }} />
                      <span>{IND_DESC[ind]}</span>
                    </div>
                    {on && <Check size={9} className="text-blue-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tools */}
        <div className="relative">
          <button onClick={() => toggleDD('tools')} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors border ${drawMode !== 'none' ? 'bg-blue-600 text-white border-blue-600' : `border-transparent ${T.btn}`}`}>
            <activeTool.Icon size={11} />
            {drawMode !== 'none' ? activeTool.label.split(' ')[0] : 'Tools'}
            <ChevronDown size={10} />
          </button>
          {openDropdown === 'tools' && (
            <div className={`absolute top-full mt-1 right-0 z-50 w-56 rounded-xl border overflow-hidden ${T.dd}`}>
              {TOOL_OPTIONS.map(({ mode, Icon, label, hint }) => (
                <button key={mode} onClick={() => { setDrawMode(mode); setAnchor(null); setOpenDropdown(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${drawMode === mode ? T.dda : T.ddi}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon size={12} />
                    <div className="text-left">
                      <div>{label}</div>
                      <div className={`text-[10px] ${T.muted}`}>{hint}</div>
                    </div>
                  </div>
                  {drawMode === mode && <Check size={9} className="text-blue-400 flex-shrink-0" />}
                </button>
              ))}
              {drawings.length > 0 && (
                <>
                  <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`} />
                  <button onClick={() => { setDrawings([]); setAnchor(null); setSelectedId(null); setOpenDropdown(null); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                    <Eraser size={12} /><span>Clear all ({drawings.length})</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {drawMode !== 'none' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 hidden sm:inline`}>
            {drawMode === 'hline' ? 'Click to place' : anchor ? '2nd click to finish' : '1st click to anchor'}
          </span>
        )}

        {/* Drawings count badge */}
        {drawings.length > 0 && drawMode === 'none' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${darkMode ? 'border-slate-600 text-slate-500' : 'border-gray-200 text-gray-400'}`}>
            {drawings.length} drawing{drawings.length > 1 ? 's' : ''}
          </span>
        )}

        {isFO && onOptionsClick && (
          <button onClick={() => onOptionsClick(cleanSym, lastPrice ?? 0)}
            className="px-2 py-1 text-[10px] font-semibold rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors">
            ⚡ Options
          </button>
        )}

        <button
          onClick={() => {
            const chart = mainChartRef.current;
            if (!chart) return;
            const range = chart.timeScale().getVisibleLogicalRange();
            if (!range) return;
            const center = (range.from + range.to) / 2;
            const half = (range.to - range.from) * 0.35;
            chart.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
          }}
          title="Zoom In"
          className={`p-1.5 rounded transition-colors ${T.btn}`}
        >
          <ZoomIn size={12} />
        </button>

        <button
          onClick={() => {
            const chart = mainChartRef.current;
            if (!chart) return;
            const range = chart.timeScale().getVisibleLogicalRange();
            if (!range) return;
            const center = (range.from + range.to) / 2;
            const half = (range.to - range.from) * 0.65;
            chart.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
          }}
          title="Zoom Out"
          className={`p-1.5 rounded transition-colors ${T.btn}`}
        >
          <ZoomOut size={12} />
        </button>

        <button onClick={() => setDarkMode(m => !m)} title="Toggle theme" className={`p-1.5 rounded transition-colors ${T.btn}`}>
          {darkMode ? <Sun size={12} /> : <Moon size={12} />}
        </button>

        <button
          onClick={() => window.open(`/chart?symbol=${encodeURIComponent(cleanSym)}&timeframe=${encodeURIComponent(currentRange)}`, '_blank', 'noopener,noreferrer')}
          title="Open in new tab"
          className={`p-1.5 rounded transition-colors ${T.btn}`}
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* ══ Chart + SVG overlay ══ */}
      <div className="relative flex-1" onClick={handleAreaClick}>
        <div ref={mainContainerRef} style={{ height: mainH }} className={drawMode !== 'none' ? 'cursor-crosshair' : ''} />

        {/* SVG overlay */}
        <svg ref={svgRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: mainH, zIndex: 20, pointerEvents: drawMode !== 'none' || selectedId !== null || drawings.length > 0 ? 'all' : 'none', overflow: 'visible', cursor: drawMode !== 'none' ? 'crosshair' : 'default' }}
          onClick={handleSvgClick}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={() => { setMouseXY(null); dragRef.current = null; }}
        >
          <g key={vpKey}>
            {renderDrawings()}
            {renderPreview()}
          </g>
          {anchor && (
            <g>
              <circle cx={anchor.x} cy={anchor.y} r={6} fill="#fbbf24" stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2} opacity={0.95} />
              <circle cx={anchor.x} cy={anchor.y} r={12} fill="none" stroke="#fbbf24" strokeWidth={1} opacity={0.3} />
            </g>
          )}
        </svg>

        {/* Loading overlay */}
        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center z-30 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'}`}>
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={22} className="text-blue-500 animate-spin" />
              <span className={`text-xs ${T.muted}`}>Loading chart…</span>
            </div>
          </div>
        )}

        {/* No-data / error state — soft inline, not blocking */}
        {!loading && (error || !dataLoaded) && (
          <div className={`absolute inset-0 flex items-center justify-center z-30 ${darkMode ? 'bg-[#0f172a]/80' : 'bg-white/80'}`}>
            <div className="text-center p-6">
              <p className={`text-sm mb-3 ${T.muted}`}>
                {error ?? 'No chart data available for this symbol / timeframe'}
              </p>
              <button
                onClick={() => { setError(null); setDataLoaded(false); setRetryCount(n => n + 1); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Live P&L Panel ── */}
        {positions.length > 0 && cur > 0 && showPnL && (
          <div onClick={e => e.stopPropagation()} className={`absolute top-2 left-2 z-30 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-sm border overflow-hidden min-w-[200px] ${darkMode ? 'bg-slate-900/90 border-slate-700' : 'bg-white/95 border-gray-200'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
              <span className={`text-[10px] font-bold tracking-wider ${T.muted}`}>OPEN POSITIONS</span>
              <button onClick={() => setShowPnL(false)} className={`text-[10px] ${T.muted} hover:text-red-400`}>✕</button>
            </div>
            {/* Per-position rows */}
            {positions.map(pos => {
              const posD   = pos.side === 'BUY' ? cur - pos.entryPrice : pos.entryPrice - cur;
              const posPnL = posD * pos.quantity;
              const posPct = (posD / pos.entryPrice) * 100;
              const posUp  = posPnL >= 0;
              const isSelling = sellModal?.posId === pos.id;
              return (
                <div key={pos.id} className={`border-b last:border-b-0 ${darkMode ? 'border-slate-700/50' : 'border-gray-50'}`}>
                  {/* Position info row */}
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={`text-[10px] font-black px-1 rounded flex-shrink-0 ${pos.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{pos.side}</span>
                      <span className={`flex-shrink-0 ${T.lbl}`}>{pos.quantity} lot{pos.quantity !== 1 ? 's' : ''}</span>
                      <span className={`text-[10px] flex-shrink-0 ${T.muted}`}>@{pos.entryPrice.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`text-right font-bold ${posUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {posUp ? '+' : ''}₹{posPnL.toFixed(0)}
                        <span className="text-[9px] ml-0.5 opacity-70">({posUp ? '+' : ''}{posPct.toFixed(1)}%)</span>
                      </div>
                      {/* Sell button — opens inline sell form */}
                      <button
                        onClick={() => setSellModal(isSelling ? null : { posId: pos.id, qty: 1, loading: false, err: '' })}
                        className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${isSelling ? (darkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600') : 'bg-red-600 hover:bg-red-500 text-white'}`}
                      >
                        {isSelling ? '✕' : 'SELL'}
                      </button>
                    </div>
                  </div>
                  {/* Inline sell form — visible when this position is selected */}
                  {isSelling && sellModal && (
                    <div className={`px-3 pb-2 pt-0.5 ${darkMode ? 'bg-slate-800/60' : 'bg-red-50/60'}`}>
                      <div className={`text-[10px] mb-1.5 ${T.muted}`}>
                        Lots to sell <span className="opacity-60">(min 1, max {pos.quantity})</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {/* Decrement */}
                        <button
                          onClick={() => setSellModal(m => m ? { ...m, qty: Math.max(1, m.qty - 1) } : m)}
                          disabled={sellModal.qty <= 1}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center disabled:opacity-30 transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          max={pos.quantity}
                          value={sellModal.qty}
                          onChange={e => setSellModal(m => m ? { ...m, qty: Math.min(pos.quantity, Math.max(1, Number(e.target.value) || 1)) } : m)}
                          className={`w-12 text-center text-xs font-bold rounded border px-1 py-0.5 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        />
                        {/* Increment */}
                        <button
                          onClick={() => setSellModal(m => m ? { ...m, qty: Math.min(pos.quantity, m.qty + 1) } : m)}
                          disabled={sellModal.qty >= pos.quantity}
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center disabled:opacity-30 transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >+</button>
                        {/* All lots shortcut */}
                        {pos.quantity > 1 && (
                          <button
                            onClick={() => setSellModal(m => m ? { ...m, qty: pos.quantity } : m)}
                            className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                          >All</button>
                        )}
                      </div>
                      <div className={`text-[10px] mb-1.5 ${T.muted}`}>
                        ≈ ₹{(sellModal.qty * cur).toLocaleString('en-IN', { maximumFractionDigits: 0 })} @ market
                      </div>
                      {sellModal.err && <p className="text-[10px] text-red-400 mb-1">{sellModal.err}</p>}
                      <button
                        onClick={() => closePosMarket(pos, sellModal.qty)}
                        disabled={sellModal.loading}
                        className="w-full py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-[11px] font-bold rounded transition-colors"
                      >
                        {sellModal.loading ? 'Placing…' : `Sell ${sellModal.qty} lot${sellModal.qty !== 1 ? 's' : ''} @ Market`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Total row */}
            {positions.length > 1 && (
              <div className={`px-3 py-1.5 flex items-center justify-between ${darkMode ? 'bg-slate-800/60' : 'bg-gray-50'}`}>
                <span className={`text-[10px] ${T.muted}`}>Net P&L</span>
                <span className={`font-bold text-sm ${pnlUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {pnlUp ? '+' : ''}₹{totalPnL.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Show P&L button when panel hidden */}
        {positions.length > 0 && cur > 0 && !showPnL && (
          <button onClick={() => setShowPnL(true)}
            className={`absolute top-2 left-2 z-30 px-2 py-1 rounded-lg text-[10px] font-bold border ${pnlUp ? (darkMode ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (darkMode ? 'bg-red-950/80 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700')}`}>
            P&L {pnlUp ? '+' : ''}₹{totalPnL.toFixed(0)}
          </button>
        )}

        {/* Quick-trade */}
        {canTrade && !showQT && (
          <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
            <button onClick={() => { setQtSide('BUY');  setQtQty(1); setShowQT(true); }} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors shadow-lg">▲ Buy</button>
            <button onClick={() => { setQtSide('SELL'); setQtQty(1); setShowQT(true); }} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-colors shadow-lg">▼ Sell</button>
          </div>
        )}
        {canTrade && showQT && (
          <div className={`absolute bottom-2 right-2 z-20 w-58 rounded-xl p-4 shadow-2xl border ${T.panel}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex bg-gray-200/20 rounded-lg p-0.5 gap-0.5">
                {(['BUY','SELL'] as const).map(s => (
                  <button key={s} onClick={() => setQtSide(s)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${qtSide === s ? (s === 'BUY' ? 'bg-emerald-600 text-white shadow' : 'bg-red-600 text-white shadow') : T.muted}`}>{s}</button>
                ))}
              </div>
              <button onClick={() => { setShowQT(false); setQtMsg(''); }} className={`${T.muted} text-base leading-none`}>✕</button>
            </div>
            <div className={`text-xs mb-3 ${T.muted}`}>Market @ ₹{cur.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
            <div className="flex gap-1 flex-wrap mb-3">
              {[1, 5, 10, 25, 50].map(q => (
                <button key={q} onClick={() => setQtQty(q)} className={`px-2 py-0.5 text-xs rounded transition-colors ${qtQty === q ? (qtSide === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600')}`}>{q}</button>
              ))}
              <input type="number" min={1} value={qtQty} onChange={e => setQtQty(Math.max(1, +e.target.value))} className={`w-14 px-1 py-0.5 text-xs rounded text-center border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`} />
            </div>
            <div className={`text-xs mb-3 ${T.muted}`}>Total ≈ ₹{(qtQty * cur).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            {qtMsg && <p className={`text-xs mb-2 ${qtMsg.startsWith('✓') ? 'text-emerald-500' : 'text-red-500'}`}>{qtMsg}</p>}
            <button onClick={placeTrade} disabled={qtLoading || cur <= 0} className={`w-full py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${qtSide === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
              {qtLoading ? 'Placing...' : `${qtSide} ${qtQty} @ Market`}
            </button>
          </div>
        )}
      </div>

      {/* ══ Sub-pane ══ */}
      {hasSubPane && (
        <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className={`px-3 py-1 flex items-center gap-3 ${T.sub}`}>
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${T.muted}`}>{subInd}</span>
            {subInd === 'RSI'  && <span className={`text-[10px] ${T.muted}`}>Period 14  ·  70 overbought  ·  30 oversold</span>}
            {subInd === 'MACD' && <span className={`text-[10px] ${T.muted}`}>12 / 26 / 9  ·  Blue = MACD  ·  Orange = Signal</span>}
          </div>
          <div ref={subContainerRef} style={{ height: subH }} />
        </div>
      )}

      {/* ══ Context menu ══ */}
      {ctxMenu && (
        <div className={`fixed z-[10000] rounded-xl border shadow-2xl overflow-hidden text-xs min-w-[160px] ${T.dd}`}
          style={{ left: ctxMenu.x, top: ctxMenu.y }}>
          {(() => {
            const d = drawings.find(x => x.id === ctxMenu.id);
            if (!d) return null;
            return (
              <>
                <div className={`px-3 py-2 border-b text-[10px] font-bold uppercase tracking-wider ${T.muted} ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                  {d.type === 'trendline' ? 'Trendline' : d.type === 'hline' ? 'H-Line' : 'Fibonacci'}
                </div>
                {/* Color picker row */}
                <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap">
                  {DRAWING_COLORS.map(c => (
                    <button key={c} onClick={() => { updateDrawing(ctxMenu.id, { color: c } as any); setCtxMenu(null); }}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: ('color' in d ? d.color : '') === c ? '#fff' : 'transparent' }} />
                  ))}
                </div>
                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`} />
                <button onClick={() => { updateDrawing(ctxMenu.id, { locked: !d.locked } as any); setCtxMenu(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${T.ddi}`}>
                  {d.locked ? <Unlock size={11} /> : <Lock size={11} />}
                  {d.locked ? 'Unlock' : 'Lock'}
                </button>
                <button onClick={() => { updateDrawing(ctxMenu.id, { visible: !d.visible } as any); setCtxMenu(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${T.ddi}`}>
                  <Palette size={11} />
                  {d.visible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => { duplicateDrawing(ctxMenu.id); setCtxMenu(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${T.ddi}`}>
                  <Copy size={11} />Duplicate
                </button>
                <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`} />
                <button onClick={() => { deleteDrawing(ctxMenu.id); setCtxMenu(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={11} />Delete
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
