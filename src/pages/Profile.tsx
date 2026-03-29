import { useState, useEffect, useMemo } from "react";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ActivityHeatMap from "../components/Profile/ActivityHeatMap";
import QuickActions from "../components/Profile/QuickActions";
import { useAuth } from "../context/AuthContext";
import { walletApi, analyticsApi, ordersApi } from "../lib/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    walletApi.get().then(res => setWallet(res.data)).catch(() => {});
    analyticsApi.getStats().then(res => setStats(res.data)).catch(() => {});
    ordersApi.list({ limit: 200 }).then(res => {
      setTrades(res.data?.data ?? []);
    }).catch(() => {});
  }, []);

  // Build real activity heatmap from actual trade dates (last 180 days)
  const activityData = useMemo(() => {
    const now = new Date();
    const days: { id: number; level: number }[] = [];

    // Count trades per day
    const tradeCounts = new Map<string, number>();
    trades.forEach((t: any) => {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      tradeCounts.set(date, (tradeCounts.get(date) || 0) + 1);
    });

    // Get max trades in a day for scaling
    const maxTrades = Math.max(1, ...Array.from(tradeCounts.values()));

    for (let i = 179; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const count = tradeCounts.get(key) || 0;
      let level = 0;
      if (count > 0) {
        const ratio = count / maxTrades;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }
      days.push({ id: 179 - i, level });
    }
    return days;
  }, [trades]);

  return (
    <main className="p-6 space-y-8 max-w-6xl mx-auto w-full">
      <ProfileHeader
        name={user?.name || "User"}
        email={user?.email || ""}
        avatar=""
      />

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Wallet Balance</p>
          <p className="text-2xl font-semibold text-green-600">
            ₹{wallet ? Number(wallet.balance).toLocaleString("en-IN") : "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Total Trades</p>
          <p className="text-2xl font-semibold">{stats?.totalTrades ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.closedTrades ?? 0} closed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Win Rate</p>
          <p className="text-2xl font-semibold">{stats?.winRate?.toFixed(1) ?? 0}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <p className="text-sm text-gray-500">Total P&L</p>
          <p className={`text-2xl font-semibold ${(stats?.totalPnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {(stats?.totalPnl ?? 0) >= 0 ? '+' : ''}₹{stats?.totalPnl?.toFixed(2) ?? '0.00'}
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-slate-500">Trading Activity (Last 180 Days)</h3>
        <ActivityHeatMap data={activityData} />
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-slate-200" />
            <div className="w-3 h-3 rounded-sm bg-blue-200" />
            <div className="w-3 h-3 rounded-sm bg-blue-300" />
            <div className="w-3 h-3 rounded-sm bg-blue-400" />
            <div className="w-3 h-3 rounded-sm bg-blue-600" />
          </div>
          <span>More</span>
        </div>
      </section>

      <QuickActions />

      <button
        onClick={async () => { await logout(); window.location.href = "/auth/login"; }}
        className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
      >
        Logout
      </button>
    </main>
  );
}