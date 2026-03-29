import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { marketApi } from '../../lib/api';
import { RefreshCw, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
}

export default function CandlestickChart({ symbol, range = '1D', height = 400, livePrice, onFullscreen }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<CandleData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const initialPriceRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<{ value: number; percent: number } | null>(null);
  const [isLive, setIsLive] = useState(false);

  // ─── Inject a live tick into the current 1-minute candle ─────────────────
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

  // ─── Single unified effect: create chart + load data ──────────────────────
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

    // 2. Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // 3. Fetch historical data (now series exists)
    setLoading(true);
    setError(null);
    marketApi.getHistory(symbol, range)
      .then(res => {
        if (!mountedRef.current) return;
        const candles: CandleData[] = (res.data || []).map((c: any) => ({
          time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
        }));
        const volumes = (res.data || []).map((c: any) => ({
          time: c.time, value: c.volume || 0,
          color: c.close >= c.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
        }));

        if (candleSeriesRef.current && candles.length > 0) {
          candleSeriesRef.current.setData(candles as any);
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
        if (volumeSeriesRef.current && volumes.length > 0) {
          volumeSeriesRef.current.setData(volumes as any);
        }
        chart.timeScale().fitContent();
      })
      .catch(err => { if (mountedRef.current) setError(err?.message || 'Failed to load chart'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });

    // 4. Start WebSocket for live ticks (1D only, only if no livePrice prop)
    if (range === '1D' && livePrice === undefined) {
      const WS_URL = `ws://${window.location.hostname}:${import.meta.env.VITE_API_PORT || 3000}/ws`;
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

  const isUp = (priceChange?.value ?? 0) >= 0;

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
        </div>

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

      {/* Error */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
          <div className="text-center">
            <p className="text-gray-500 mb-2 text-sm">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}
