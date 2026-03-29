import { useState } from 'react';
import { PortfolioChart, AnalyticsChart, TradePerformanceChart } from '../components/charts';
import { Calendar, BarChart3, TrendingUp } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);

  const dayOptions = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'All Time', value: 365 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Track your trading performance and portfolio growth</p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
              {dayOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDays(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    days === option.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Portfolio Performance - Full Width */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Portfolio Performance</h2>
            </div>
            <PortfolioChart days={days} height={400} className="shadow-lg" />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trade Analytics */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Trade Statistics</h2>
              </div>
              <AnalyticsChart days={days} height={300} className="shadow-lg" />
            </div>

            {/* Trade Performance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Trade Performance</h2>
              </div>
              <TradePerformanceChart days={days} height={300} className="shadow-lg" />
            </div>
          </div>

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-600 font-medium mb-1">TOTAL P&L</p>
              <p className="text-2xl font-bold text-green-600">₹12,450</p>
              <p className="text-xs text-gray-500 mt-2">+5.2% this month</p>
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-600 font-medium mb-1">WIN RATE</p>
              <p className="text-2xl font-bold text-blue-600">62.5%</p>
              <p className="text-xs text-gray-500 mt-2">25 wins / 15 losses</p>
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-600 font-medium mb-1">PROFIT FACTOR</p>
              <p className="text-2xl font-bold text-purple-600">2.4</p>
              <p className="text-xs text-gray-500 mt-2">Avg win vs loss ratio</p>
            </div>

            <div className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-600 font-medium mb-1">TOTAL TRADES</p>
              <p className="text-2xl font-bold text-orange-600">127</p>
              <p className="text-xs text-gray-500 mt-2">In selected period</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
