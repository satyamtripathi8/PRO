import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import { analyticsApi } from '../../lib/api';
import { BarChart3, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface TradeStats {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  avgWinSize: number;
  avgLossSize: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
}

interface Props {
  days?: number;
  height?: number;
  className?: string;
}

export default function AnalyticsChart({ days = 30, height = 300, className }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const winLossSeriesRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TradeStats>({
    totalTrades: 0,
    winTrades: 0,
    lossTrades: 0,
    winRate: 0,
    avgWinSize: 0,
    avgLossSize: 0,
    profitFactor: 0,
    largestWin: 0,
    largestLoss: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await analyticsApi.getStats?.({}) || { data: null };
        
        if (!res.data) {
          setError('No analytics data available');
          setLoading(false);
          return;
        }

        const data = res.data;
        setStats({
          totalTrades: data.totalTrades || 0,
          winTrades: data.winTrades || 0,
          lossTrades: data.lossTrades || 0,
          winRate: data.winRate || 0,
          avgWinSize: data.avgWinSize || 0,
          avgLossSize: data.avgLossSize || 0,
          profitFactor: data.profitFactor || 0,
          largestWin: data.largestWin || 0,
          largestLoss: data.largestLoss || 0,
        });
        setLoading(false);
      } catch (err) {
        console.error('[AnalyticsChart] Failed to fetch stats:', err);
        setError('Failed to load analytics');
        setLoading(false);
      }
    };

    fetchStats();
  }, [days]);

  useEffect(() => {
    if (!chartContainerRef.current || stats.totalTrades === 0) return;

    try {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
          attributionLogo: false,
        },
        width: chartContainerRef.current.clientWidth,
        height,
        rightPriceScale: {
          borderColor: '#e0e0e0',
          autoScale: true,
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
      });

      chartRef.current = chart;

      // Create histogram for win/loss data
      const winLossSeries = chart.addSeries(HistogramSeries, {
        color: stats.winRate >= 50 ? '#22c55e' : '#ef4444',
      });

      winLossSeriesRef.current = winLossSeries as any;

      // Create data points: [0] = losses, [1] = wins
      const histogramData = [
        {
          time: 1 as Time,
          value: stats.lossTrades,
          color: '#ef4444',
        },
        {
          time: 2 as Time,
          value: stats.winTrades,
          color: '#22c55e',
        },
      ];

      winLossSeries.setData(histogramData);
      chart.timeScale().fitContent();

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
      console.error('[AnalyticsChart] Chart initialization failed:', err);
      setError('Failed to render chart');
    }
  }, [stats, height]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
            <BarChart3 className="w-4 h-4" /> Trade Analytics
          </p>
          <p className="text-xl font-bold text-gray-800 mt-1">{stats.totalTrades} Trades</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Win Rate</p>
          <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.winRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b text-sm">
        <div className="bg-white rounded p-3 border">
          <p className="text-xs text-gray-600 mb-1">Wins / Losses</p>
          <p className="font-semibold">
            <span className="text-green-600">{stats.winTrades}</span> / <span className="text-red-600">{stats.lossTrades}</span>
          </p>
        </div>

        <div className="bg-white rounded p-3 border">
          <p className="text-xs text-gray-600 mb-1">Profit Factor</p>
          <p className="font-semibold text-blue-600">{stats.profitFactor.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded p-3 border">
          <p className="text-xs text-gray-600 mb-1">Avg Win / Loss</p>
          <p className="text-xs">
            <span className="text-green-600">₹{stats.avgWinSize.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> / 
            <span className="text-red-600"> ₹{Math.abs(stats.avgLossSize).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </p>
        </div>

        <div className="bg-white rounded p-3 border">
          <p className="text-xs text-gray-600 mb-1">Best / Worst</p>
          <p className="text-xs">
            <span className="text-green-600">+₹{stats.largestWin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> / 
            <span className="text-red-600"> -₹{Math.abs(stats.largestLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-yellow-50 z-10">
            <p className="text-sm text-yellow-600">{error}</p>
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

      {/* Footer Legend */}
      <div className="flex gap-6 px-4 py-3 bg-gray-50 border-t text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-gray-600">Losing Trades</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-gray-600">Winning Trades</span>
        </div>
      </div>
    </div>
  );
}
