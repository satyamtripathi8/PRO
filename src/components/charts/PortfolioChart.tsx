import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import { portfolioApi } from '../../lib/api';
import { RefreshCw, TrendingUp, ZoomIn, ZoomOut } from 'lucide-react';

interface PortfolioHistoryPoint {
  date: string;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  investedAmount: number;
  holdingsCount: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
}

interface Props {
  days?: number;
  height?: number;
  className?: string;
}

export default function PortfolioChart({ days = 30, height = 400, className }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const pnlSeriesRef = useRef<any>(null);
  const investedSeriesRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioHistoryPoint[]>([]);
  const [stats, setStats] = useState({
    currentPnL: 0,
    maxPnL: 0,
    minPnL: 0,
    avgPnL: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await portfolioApi.getHistory(days);
        const historyData = res.data || [];
        
        if (historyData.length === 0) {
          setError('No portfolio history data available');
          setLoading(false);
          return;
        }

        setData(historyData);

        // Calculate stats
        const pnlValues = historyData.map((d: PortfolioHistoryPoint) => d.totalPnL);
        const maxPnL = Math.max(...pnlValues);
        const minPnL = Math.min(...pnlValues);
        const avgPnL = pnlValues.reduce((a: number, b: number) => a + b, 0) / pnlValues.length;
        const currentPnL = pnlValues[pnlValues.length - 1] || 0;

        setStats({ currentPnL, maxPnL, minPnL, avgPnL });
        setLoading(false);
      } catch (err) {
        console.error('[PortfolioChart] Failed to fetch history:', err);
        setError('Failed to load portfolio history');
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
          attributionLogo: false,
        },
        width: chartContainerRef.current.clientWidth,
        height,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          fixLeftEdge: true,
        },
        rightPriceScale: {
          borderColor: '#e0e0e0',
          autoScale: true,
        },
        leftPriceScale: {
          borderColor: '#e0e0e0',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: 1, // Magnet
        },
      });

      chartRef.current = chart;

      // P&L Line (right scale - primary)
      const pnlSeries = chart.addSeries(LineSeries, {
        color: stats.currentPnL >= 0 ? '#22c55e' : '#ef4444',
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: true,
      });

      pnlSeriesRef.current = pnlSeries as any;

      // Invested Amount Line (left scale - secondary)
      const investedSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        lastValueVisible: true,
        lineStyle: LineStyle.Dashed,
      });

      investedSeries.applyOptions({
        priceScaleId: 'left',
      });

      investedSeriesRef.current = investedSeries as any;

      // Convert data to chart format
      const pnlData = data.map((d: PortfolioHistoryPoint) => ({
        time: Math.floor(new Date(d.date).getTime() / 1000) as Time,
        value: d.totalPnL,
      }));

      const investedData = data.map((d: PortfolioHistoryPoint) => ({
        time: Math.floor(new Date(d.date).getTime() / 1000) as Time,
        value: d.investedAmount,
      }));

      pnlSeries.setData(pnlData);
      investedSeries.setData(investedData);

      // Auto-fit chart to data
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (!chartContainerRef.current || !chart) return;
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('[PortfolioChart] Chart initialization failed:', err);
      setError('Failed to render chart');
    }
  }, [data, stats.currentPnL, height]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading portfolio history...</p>
        </div>
      </div>
    );
  }

  const isPositive = stats.currentPnL >= 0;

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header Stats */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-600 font-medium">Total P&L</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.currentPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <TrendingUp className={`w-8 h-8 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-600">Best Day</p>
            <p className="font-semibold text-green-600">
              ₹{stats.maxPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Worst Day</p>
            <p className="font-semibold text-red-600">
              ₹{stats.minPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Avg Daily</p>
            <p className="font-semibold text-gray-800">
              ₹{stats.avgPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={() => {
              if (!chartRef.current) return;
              const range = chartRef.current.timeScale().getVisibleLogicalRange();
              if (!range) return;
              const center = (range.from + range.to) / 2;
              const half = (range.to - range.from) * 0.35;
              chartRef.current.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
            }}
            className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => {
              if (!chartRef.current) return;
              const range = chartRef.current.timeScale().getVisibleLogicalRange();
              if (!range) return;
              const center = (range.from + range.to) / 2;
              const half = (range.to - range.from) * 0.65;
              chartRef.current.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
            }}
            className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} className="text-gray-600" />
          </button>
        </div>
        <div
          ref={chartContainerRef}
          style={{ height: `${height}px` }}
          className="w-full"
        />
      </div>

      {/* Legend */}
      <div className="flex gap-6 px-4 py-3 bg-gray-50 border-t text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-600">Total P&L (Right Scale)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-gray-600">Invested Amount (Left Scale)</span>
        </div>
      </div>
    </div>
  );
}
