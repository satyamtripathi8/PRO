import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Shield, Target, BarChart3, Users, Clock, RefreshCw } from 'lucide-react';
import { leaderboardApi } from '../lib/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  bestTrade: number;
  compositeScore?: number;
  disciplineScore?: number;
  consistencyScore?: number;
  riskScore?: number;
}

const RANK_STYLES: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
  1: { bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', border: 'border-yellow-300', badge: 'bg-yellow-400 text-yellow-900', icon: '🥇' },
  2: { bg: 'bg-gradient-to-br from-gray-50 to-slate-100', border: 'border-gray-300', badge: 'bg-gray-300 text-gray-800', icon: '🥈' },
  3: { bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-300', badge: 'bg-orange-400 text-orange-900', icon: '🥉' },
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'overall' | 'daily' | 'platform'>('overall');
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('all-time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lbRes, dailyRes, platformRes] = await Promise.all([
          leaderboardApi.get(activeTab === 'overall' ? timeFilter : 'daily'),
          leaderboardApi.daily().catch(() => ({ data: null })),
          leaderboardApi.platform().catch(() => ({ data: null })),
        ]);
        setLeaderboard(lbRes.data || []);
        setDailyStats(dailyRes.data);
        setPlatformStats(platformRes.data);
      } catch {
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, timeFilter]);

  const tabs = [
    { key: 'overall' as const, label: 'Top Traders', icon: Trophy },
    { key: 'daily' as const, label: 'Today', icon: Clock },
    { key: 'platform' as const, label: 'Platform', icon: Users },
  ];

  const timeFilters = [
    { key: 'daily' as const, label: 'Today' },
    { key: 'weekly' as const, label: 'This Week' },
    { key: 'monthly' as const, label: 'This Month' },
    { key: 'all-time' as const, label: 'All Time' },
  ];

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            Leaderboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ranked by discipline, consistency & risk management — not just profit
          </p>
        </div>
        {loading && <RefreshCw size={20} className="animate-spin text-gray-400" />}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">How Rankings Work</p>
            <p className="text-xs text-blue-600 mt-1">
              Traders are scored on <strong>Discipline</strong> (40%) — stop-loss usage & adherence, 
              <strong> Consistency</strong> (35%) — stable win rate, and 
              <strong> Risk Management</strong> (25%) — controlled risk per trade. Pure profit doesn't determine rank.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0 flex-wrap items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}

        {/* Time Filters - Show only for Overall tab */}
        {activeTab === 'overall' && (
          <div className="ml-auto flex gap-2">
            {timeFilters.map(filter => (
              <button
                key={filter.key}
                onClick={() => setTimeFilter(filter.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  timeFilter === filter.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overall Leaderboard */}
      {activeTab === 'overall' && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Trophy size={32} className="mx-auto mb-2 opacity-50" />
              No traders yet. Start trading to appear on the leaderboard!
            </div>
          ) : (
            leaderboard.map((entry) => {
              const style = RANK_STYLES[entry.rank] || { bg: 'bg-white', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', icon: '' };
              return (
                <div
                  key={entry.userId}
                  className={`${style.bg} border ${style.border} rounded-xl p-4 md:p-5 flex items-center gap-4 transition-shadow hover:shadow-md`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full ${style.badge} flex items-center justify-center font-bold text-lg shrink-0`}>
                    {style.icon || entry.rank}
                  </div>

                  {/* Name & Avatar */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {entry.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{entry.name}</p>
                      <p className="text-xs text-gray-500">{entry.totalTrades} trades</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Win Rate</p>
                      <p className="font-semibold text-gray-800">{entry.winRate?.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">P&L</p>
                      <p className={`font-semibold ${entry.totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {entry.totalPnl >= 0 ? '+' : ''}₹{entry.totalPnl?.toFixed(0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Best Trade</p>
                      <p className="font-semibold text-green-600">+₹{entry.bestTrade?.toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden text-right">
                    <p className={`font-semibold ${entry.totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.totalPnl >= 0 ? '+' : ''}₹{entry.totalPnl?.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">{entry.winRate?.toFixed(1)}% WR</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Daily Stats */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <BarChart3 size={16} />
              <p className="text-sm">Total Trades Today</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{dailyStats?.totalTrades ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Target size={16} />
              <p className="text-sm">Active Trades</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{dailyStats?.activeTrades ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp size={16} />
              <p className="text-sm">Volume (INR)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{(dailyStats?.totalVolumeINR ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock size={16} />
              <p className="text-sm">Date</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{dailyStats?.date ?? new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Platform Stats */}
      {activeTab === 'platform' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <Users size={18} />
              <p className="text-sm">Total Users</p>
            </div>
            <p className="text-4xl font-bold">{platformStats?.totalUsers ?? 0}</p>
            <p className="text-sm opacity-70 mt-1">{platformStats?.activeUsersLast24h ?? 0} active in last 24h</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <BarChart3 size={18} />
              <p className="text-sm">Total Trades</p>
            </div>
            <p className="text-4xl font-bold">{platformStats?.totalTrades ?? 0}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-6 text-white col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <TrendingUp size={18} />
              <p className="text-sm">Platform Total P&L</p>
            </div>
            <p className={`text-4xl font-bold`}>
              {(platformStats?.totalPlatformPnl ?? 0) >= 0 ? '+' : ''}₹{(platformStats?.totalPlatformPnl ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
