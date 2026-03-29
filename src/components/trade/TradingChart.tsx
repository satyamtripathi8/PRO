import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import { marketApi } from "../../lib/api";

interface Props {
  symbol: string;
  interval?: string;
  range?: string;
}

export default function TradingChart({ symbol, range = "1D" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#333",
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 400,
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      rightPriceScale: {
        borderColor: "#e0e0e0",
      },
      timeScale: {
        borderColor: "#e0e0e0",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Fetch candle data from our API
    const fetchData = async () => {
      try {
        const res = await marketApi.getHistory(symbol, range);
        const candles = (res.data || []).map((c: any) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));
        if (candles.length > 0) {
          candleSeries.setData(candles as any);
          chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("[TradingChart] Failed to load data:", err);
      }
    };

    fetchData();

    // Auto-refresh for intraday
    let refreshTimer: ReturnType<typeof setInterval> | null = null;
    if (range === "1D") {
      refreshTimer = setInterval(fetchData, 10000); // refresh every 10s for intraday
    }

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 400,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (refreshTimer) clearInterval(refreshTimer);
      chart.remove();
    };
  }, [symbol, range]);

  return (
    <div className="h-full w-full min-h-[300px]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
