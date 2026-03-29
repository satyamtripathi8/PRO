import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';
import { analyticsApi } from '../../lib/api';
import { Calendar, RefreshCw, TrendingUp } from 'lucide-react';

interface TradeData {
  date: string;
  cumulativePnL: number;
  tradesCount: number;
  winCount: number;
  winRate: number;
}

interface Props {
  days?: number;
  height?: number;
  className?: string;
}

export default function TradePerformanceChart({ days = 30, height = 350, className }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const cumulativePnLSeriesRef = useRef<any>(null);
  const winRateSeriesRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TradeData[]>([]);
  const [stats, setStats] = useState({
    totalPnL: 0,
    totalTrades: 0,
    avgWinRate: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch trades data
        const res = await analyticsApi.getTrades?.({ limit: '500' }) || { data: [] };
        const trades = res.data || [];

        if (trades.length === 0) {
          setError('No trades found');
          setLoading(false);
          return;
        }

        // Group trades by date and calculate cumulative P&L
        const tradesByDate: Record<string, any[]> = {};
        trades.forEach((trade: any) => {
          const date = trade.trade_date || new Date().toISOString().split('T')[0];
          if (!tradesByDate[date]) tradesByDate[date] = [];
          tradesByDate[date].push(trade);
        });

        // Build cumulative data
        const sortedDates = Object.keys(tradesByDate).sort();
        let cumulativePnL = 0;
        const chartData: TradeData[] = [];

        sortedDates.forEach(date => {
          const dayTrades = tradesByDate[date];
          const dayPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          const dayWins = dayTrades.filter((t: any) => (t.pnl || 0) > 0).length;

          cumulativePnL += dayPnL;
          chartData.push({
            date,
            cumulativePnL,
            tradesCount: dayTrades.length,
            winCount: dayWins,
            winRate: dayTrades.length > 0 ? (dayWins / dayTrades.length) * 100 : 0,
          });
        });

        setData(chartData);
        setStats({
          totalPnL: cumulativePnL,
          totalTrades: trades.length,
          avgWinRate: trades.filter((t: any) => (t.pnl || 0) > 0).length / trades.length * 100,
        });
        setLoading(false);
      } catch (err) {
        console.error('[TradePerformanceChart] Failed to fetch data:', err);
        setError('Failed to load trade data');
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

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
        leftPriceScale: {
          borderColor: '#e0e0e0',
          visible: true,
          autoScale: true,
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

      // Cumulative P&L line (right scale)
      const pnlSeries = chart.addSeries(LineSeries, {
        color: stats.totalPnL >= 0 ? '#22c55e' : '#ef4444',
        lineWidth: 3,
        lastValueVisible: true,
        priceLineVisible: true,
      });

      cumulativePnLSeriesRef.current = pnlSeries as any;

      // Win rate line (left scale)
      const winRateSeries = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        lastValueVisible: true,
        lineStyle: LineStyle.Dashed,
      });

      winRateSeries.applyOptions({
        priceScaleId: 'left',
      });

      winRateSeriesRef.current = winRateSeries as any;

      // Format data for chart
      const pnlData = data.map(d => ({
        time: Math.floor(new Date(`${d.date}T12:00:00`).getTime() / 1000) as Time,
        value: d.cumulativePnL,
      }));

      const winRateData = data.map(d => ({
        time: Math.floor(new Date(`${d.date}T12:00:00`).getTime() / 1000) as Time,
        value: d.winRate,
      }));

      pnlSeries.setData(pnlData);
      winRateSeries.setData(winRateData);

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
      console.error('[TradePerformanceChart] Chart initialization failed:', err);
      setError('Failed to render chart');
    }
  }, [data, stats.totalPnL, height]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading trade performance...</p>
        </div>
      </div>
    );
  }

  const isPositive = stats.totalPnL >= 0;

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      {/* Header - Similar to PortfolioChart */}
      <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Cumulative P&L (All Trades)</p>
              <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                ₹{stats.totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <TrendingUp className={`w-8 h-8 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-600">Total Trades</p>
            <p className="font-semibold text-gray-800">{stats.totalTrades}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Win Rate</p>
            <p className="font-semibold text-purple-600">{stats.avgWinRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-yellow-50 z-10">
            <p className="text-sm text-yellow-600">{error}</p>
          </div>
        )}
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
          <span className="text-gray-600">Cumulative P&L (Right)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-gray-600">Win Rate % (Left)</span>
        </div>
      </div>
    </div>
  );
}
