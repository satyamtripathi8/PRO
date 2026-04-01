import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, IPriceLine } from 'lightweight-charts';
import { marketApi } from '../../lib/api';
import { RefreshCw, Maximize2, AlertTriangle } from 'lucide-react';
import { WS_BASE_URL } from '../../lib/config';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  symbol: string;
  range?: string;
  height?: number;
  livePrice?: number;
  onFullscreen?: () => void;
  entryPrice?: number;
  holdingQty?: number;
  stopLossPrice?: number;
  onChartReady?: (api: {
    priceToCoor: (price: number) => number | null;
    coorToPrice: (y: number) => number | null;
  }) => void;
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="relative w-full animate-pulse" style={{ height }}>
      <div className="absolute inset-0 bg-gray-50 rounded-lg overflow-hidden">
        {/* Faux candlesticks */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-8 pb-8">
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 20 + Math.random() * 60;
            const isUp = Math.random() > 0.45;
            return (
              <div key={i} className="flex flex-col items-center gap-0" style={{ width: '2.5%' }}>
                <div
                  className={`w-px ${isUp ? 'bg-green-200' : 'bg-red-200'}`}
                  style={{ height: h * 0.3 }}
                />
                <div
                  className={`w-full rounded-sm ${isUp ? 'bg-green-200' : 'bg-red-200'}`}
                  style={{ height: h * 0.5 }}
                />
                <div
                  className={`w-px ${isUp ? 'bg-green-200' : 'bg-red-200'}`}
                  style={{ height: h * 0.2 }}
                />
              </div>
            );
          })}
        </div>
        {/* Overlay shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer" />
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
            <RefreshCw size={16} className="text-blue-500 animate-spin" />
            <span className="text-sm text-gray-500 font-medium">Loading chart...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fallback / Error State ────────────────────────────────────────────────────
function ChartFallback({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <AlertTriangle size={32} className="text-gray-400 mb-3" />
      <p className="text-gray-500 text-sm mb-1 font-medium">Chart unavailable</p>
      <p className="text-gray-400 text-xs mb-4 max-w-[200px] text-center">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2500, 5000]; // exponential backoff

export default function CandlestickChart({
  symbol,
  range = '1D',
  height = 400,
  livePrice,
  onFullscreen,
  entryPrice,
  holdingQty,
  stopLossPrice,
  onChartReady,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandleData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const initialPriceRef = useRef<number | null>(null);
  const entryLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{ value: number; percent: number } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // ─── P&L calculation ─────────────────────────────────────────────────────────
  const pnl = entryPrice && holdingQty && lastPrice
    ? { value: (lastPrice - entryPrice) * holdingQty, percent: ((lastPrice - entryPrice) / entryPrice) * 100 }
    : null;

  // ─── Inject a live tick into the current 1-minute candle ─────────────────────
  const injectTick = useCallback((price: number) => {
    if (!candleSeriesRef.current || !lastCandleRef.current || price <= 0) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / 60) * 60;
    const prev = lastCandleRef.current;

    const updated: CandleData =
      candleTime <= prev.time
        ? {
            time: prev.time,
            open: prev.open,
            high: Math.max(prev.high, price),
            low: Math.min(prev.low, price),
            close: price,
          }
        : { time: candleTime, open: price, high: price, low: price, close: price };

    lastCandleRef.current = updated;
    try { candleSeriesRef.current.update(updated as any); } catch {}
    setLastPrice(price);
  }, []);

  // ─── Fetch data with retry ───────────────────────────────────────────────────
  const fetchChartData = useCallback(async (
    series: ISeriesApi<'Candlestick'>,
    volSeries: ISeriesApi<'Histogram'>,
    chart: IChartApi,
    attempt = 0,
  ): Promise<void> => {
    try {
      const res = await marketApi.getHistory(symbol, range);
      if (!mountedRef.current) return;

      const candles: CandleData[] = (res.data || []).map((c: any) => ({
        time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
      }));
      const volumes = (res.data || []).map((c: any) => ({
        time: c.time, value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
      }));

      if (candles.length > 0) {
        series.setData(candles as any);
        const first = candles[0];
        const last = candles[candles.length - 1];
        lastCandleRef.current = last;
        initialPriceRef.current = first.open;
        setLastPrice(last.close);
        setPriceChange({
          value: last.close - first.open,
          percent: ((last.close - first.open) / first.open) * 100,
        });
      }
      if (volumes.length > 0) {
        volSeries.setData(volumes as any);
      }
      chart.timeScale().fitContent();
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (attempt < MAX_RETRIES - 1) {
        setRetryCount(attempt + 1);
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] || 2000));
        if (mountedRef.current) {
          return fetchChartData(series, volSeries, chart, attempt + 1);
        }
      } else {
        setError(err?.message || 'Failed to load chart data');
        setRetryCount(0);
      }
    }
  }, [symbol, range]);

  // ─── Single unified effect: create chart + load data ──────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;
    mountedRef.current = true;

    // 1. Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#333' },
      width: chartContainerRef.current.clientWidth,
      height,
      grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#e0e0e0', scaleMargins: { top: 0.1, bottom: 0.25 } },
      timeScale: { borderColor: '#e0e0e0', timeVisible: true, secondsVisible: false },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' }, priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

    // 2. Expose chart coordinate converters for drawing tools
    if (onChartReady) {
      onChartReady({
        priceToCoor: (price: number) => {
          try {
            const coor = candleSeries.priceToCoordinate(price);
            return coor ?? null;
          } catch { return null; }
        },
        coorToPrice: (y: number) => {
          try {
            const price = candleSeries.coordinateToPrice(y);
            return typeof price === 'number' && isFinite(price) ? price : null;
          } catch { return null; }
        },
      });
    }

    // 3. Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // 3. Fetch historical data with retry
    setLoading(true);
    setError(null);
    fetchChartData(candleSeries, volumeSeries, chart)
      .finally(() => { if (mountedRef.current) setLoading(false); });

    // 4. Start WebSocket for live ticks (1D only, only if no livePrice prop)
    if (range === '1D' && livePrice === undefined) {
      const WS_URL = WS_BASE_URL;
      const connect = () => {
        if (!mountedRef.current) return;
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) { ws.close(); return; }
          ws.send(JSON.stringify({ type: 'subscribe', symbols: [symbol] }));
          setIsLive(true);
        };
        ws.onmessage = (ev) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'quote' && (msg.symbol === symbol || msg.data?.symbol === symbol)) {
              const price = msg.data?.price;
              if (price > 0) injectTick(price);
            }
          } catch {}
        };
        ws.onclose = () => {
          setIsLive(false);
          if (mountedRef.current) setTimeout(connect, 3000);
        };
        ws.onerror = () => { ws.close(); };
      };
      connect();
    }

    return () => {
      mountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setIsLive(false);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      lastCandleRef.current = null;
      entryLineRef.current = null;
      slLineRef.current = null;
    };
  }, [symbol, range, height]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Inject livePrice from parent (Trade page already subscribed) ─────────
  useEffect(() => {
    if (livePrice !== undefined && livePrice > 0 && range === '1D') {
      injectTick(livePrice);

      // Update price change relative to initial
      if (initialPriceRef.current) {
        const delta = livePrice - initialPriceRef.current;
        setPriceChange({ value: delta, percent: (delta / initialPriceRef.current) * 100 });
      }
    }
  }, [livePrice, range, injectTick]);

  // ─── Entry price line overlay ─────────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove old line
    if (entryLineRef.current) {
      try { candleSeriesRef.current.removePriceLine(entryLineRef.current); } catch {}
      entryLineRef.current = null;
    }

    // Add new entry price line
    if (entryPrice && entryPrice > 0) {
      entryLineRef.current = candleSeriesRef.current.createPriceLine({
        price: entryPrice,
        color: '#3b82f6',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `Entry ₹${entryPrice.toFixed(2)}`,
      });
    }
  }, [entryPrice, loading]);

  // ─── Stop loss price line overlay ─────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove old line
    if (slLineRef.current) {
      try { candleSeriesRef.current.removePriceLine(slLineRef.current); } catch {}
      slLineRef.current = null;
    }

    // Add new SL line
    if (stopLossPrice && stopLossPrice > 0) {
      slLineRef.current = candleSeriesRef.current.createPriceLine({
        price: stopLossPrice,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `SL ₹${stopLossPrice.toFixed(2)}`,
      });
    }
  }, [stopLossPrice, loading]);

  // ─── Manual retry handler ────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current) return;
    setLoading(true);
    setError(null);
    fetchChartData(candleSeriesRef.current, volumeSeriesRef.current, chartRef.current)
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [fetchChartData]);

  const isUp = (priceChange?.value ?? 0) >= 0;

  // ─── Show skeleton while loading ─────────────────────────────────────────────
  if (loading && !lastPrice) {
    return <ChartSkeleton height={height} />;
  }

  // ─── Show fallback if all retries failed ──────────────────────────────────────
  if (error && !lastPrice) {
    return (
      <div style={{ height }}>
        <ChartFallback onRetry={handleRetry} message={error} />
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Header */}
      <div className="absolute top-2 left-4 right-4 z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">{symbol}</span>
            {lastPrice !== null && (
              <>
                <span className="font-bold text-gray-900">
                  {lastPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                {priceChange && (
                  <span className={`text-sm font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp ? '+' : ''}{priceChange.value.toFixed(2)} ({isUp ? '+' : ''}{priceChange.percent.toFixed(2)}%)
                  </span>
                )}
              </>
            )}
          </div>

          {range === '1D' && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isLive || livePrice ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive || livePrice ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isLive || livePrice ? 'Live' : 'Connecting...'}
            </span>
          )}

          {loading && <RefreshCw size={16} className="text-blue-500 animate-spin" />}
          {retryCount > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Retry {retryCount}/{MAX_RETRIES}...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* P&L Badge */}
          {pnl && (
            <div className={`px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold ${
              pnl.value >= 0
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              P&L: {pnl.value >= 0 ? '+' : ''}₹{Math.abs(pnl.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              {' '}({pnl.percent >= 0 ? '+' : ''}{pnl.percent.toFixed(2)}%)
            </div>
          )}

          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Fullscreen (F)"
              aria-label="Fullscreen chart"
            >
              <Maximize2 size={18} className="text-gray-600 hover:text-gray-900" />
            </button>
          )}
        </div>
      </div>

      {/* Error overlay (when we have data but a refresh failed) */}
      {error && lastPrice && (
        <div className="absolute bottom-2 left-4 z-10">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-xs text-amber-700">Update failed</span>
            <button onClick={handleRetry} className="text-xs text-blue-600 hover:underline font-medium">Retry</button>
          </div>
        </div>
      )}

      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
