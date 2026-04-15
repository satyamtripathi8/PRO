import { useEffect, useState } from "react";
import DisciplineTrend from "../components/analytics/DisciplineTrend";
import StabilityRadar from "../components/analytics/StabilityRadar";
import ViolationCard from "../components/analytics/ViolationCard";
import ParticipationCard from "../components/analytics/Participation";
import { analyticsApi, pnlApi, aiSummaryApi } from "../lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DailyPnL {
  date: string;
  totalPnL: number;
  winCount: number;
  lossCount: number;
  tradeCount: number;
  bestTrade: number;
  worstTrade: number;
}

interface PnLSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  winRate: number;
  totalTrades: number;
}

interface AISummaryItem {
  id: string;
  type: string;
  createdAt: string;
  content: string;
}

type TabId = "discipline" | "summaries" | "pnl-history";

// ─── Sub-components ────────────────────────────────────────────────────────

function PnlBadge({ value }: { value: number }) {
  const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-500" : "text-gray-600";
  const sign = value > 0 ? "+" : "";
  return <span className={`font-semibold ${color}`}>{sign}₹{value.toFixed(2)}</span>;
}

function PnLHistoryTab() {
  const [history, setHistory] = useState<DailyPnL[]>([]);
  const [summary, setSummary] = useState<PnLSummary | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      pnlApi.history(days),
      pnlApi.summary(),
    ])
      .then(([histRes, sumRes]) => {
        setHistory(histRes.data ?? []);
        setSummary(sumRes);
      })
      .catch(() => setError("Could not load P&L data. Make sure you are logged in."))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Loading P&L data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>
    );
  }

  const maxAbs = Math.max(...history.map(d => Math.abs(d.totalPnL)), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Today", value: summary.today },
            { label: "This Week", value: summary.thisWeek },
            { label: "This Month", value: summary.thisMonth },
            { label: "All Time", value: summary.allTime },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 border shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <PnlBadge value={card.value} />
            </div>
          ))}
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Win Rate</p>
            <p className="font-semibold text-blue-600">{summary.winRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Trades</p>
            <p className="font-semibold">{summary.totalTrades}</p>
          </div>
        </div>
      )}

      {/* Time range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Show last:</span>
        {[7, 14, 30, 60, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              days === d
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Daily P&L — Last {days} days</h3>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No closed trades in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-0" style={{ minHeight: 140 }}>
              {history.map((d) => {
                const barH = Math.round((Math.abs(d.totalPnL) / maxAbs) * 120);
                const isProfit = d.totalPnL >= 0;
                return (
                  <div
                    key={d.date}
                    className="group flex flex-col items-center flex-1 min-w-[20px] max-w-[40px] cursor-default"
                    title={`${d.date}\nP&L: ₹${d.totalPnL.toFixed(2)}\nTrades: ${d.tradeCount} (${d.winCount}W/${d.lossCount}L)`}
                  >
                    {/* bar */}
                    <div
                      className={`w-full rounded-t transition-all ${
                        isProfit ? "bg-green-400 group-hover:bg-green-500" : "bg-red-400 group-hover:bg-red-500"
                      }`}
                      style={{ height: barH || 2 }}
                    />
                    {/* date */}
                    <p className="mt-1 text-[9px] text-gray-400 rotate-[-45deg] origin-top-left whitespace-nowrap">
                      {d.date.slice(5)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total P&L</th>
                <th className="px-4 py-3 text-right">Trades</th>
                <th className="px-4 py-3 text-right">W/L</th>
                <th className="px-4 py-3 text-right">Best</th>
                <th className="px-4 py-3 text-right">Worst</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...history].reverse().map(d => (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{d.date}</td>
                  <td className="px-4 py-3 text-right"><PnlBadge value={d.totalPnL} /></td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.tradeCount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-green-600">{d.winCount}W</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-red-500">{d.lossCount}L</span>
                  </td>
                  <td className="px-4 py-3 text-right"><PnlBadge value={d.bestTrade} /></td>
                  <td className="px-4 py-3 text-right"><PnlBadge value={d.worstTrade} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummariesTab() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [summaries, setSummaries] = useState<AISummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    aiSummaryApi
      .get(period)
      .then((res) => setSummaries(res.data?.summaries ?? []))
      .catch(() => setError("Could not load summaries."))
      .finally(() => setLoading(false));
  }, [period]);

  const periodLabels: Record<typeof period, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  return (
    <div className="space-y-4">
      {/* Period toggle */}
      <div className="flex gap-2">
        {(["daily", "weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          Loading {periodLabels[period].toLowerCase()} summaries…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>
      )}

      {!loading && !error && summaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
          No {periodLabels[period].toLowerCase()} summaries yet.
          <br />
          <span className="text-xs">
            Summaries are generated automatically after market close. You can also trigger one from the AI Coach page.
          </span>
        </div>
      )}

      {!loading && summaries.map((s) => (
        <div key={s.id} className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              s.type === "DAILY"
                ? "bg-blue-50 text-blue-700"
                : s.type === "WEEKLY"
                ? "bg-purple-50 text-purple-700"
                : "bg-orange-50 text-orange-700"
            }`}>
              {s.type}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(s.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{s.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Analytics Page ────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "discipline",  label: "Discipline" },
  { id: "summaries",  label: "AI Summaries" },
  { id: "pnl-history", label: "P&L History" },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabId>("discipline");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    analyticsApi.getStats().then(res => setStats(res.data)).catch(() => {});
  }, []);

  const winRate = stats?.winRate ?? 0;
  const slModCount = stats?.slModifiedCount ?? 0;
  const slRemCount = stats?.slRemovedCount ?? 0;
  const totalTrades = stats?.totalTrades ?? 0;
  const disciplineScore = totalTrades > 0
    ? Math.max(0, Math.min(100, Math.round(winRate - (slRemCount / totalTrades) * 50)))
    : 0;

  return (
    <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-gray-500 text-sm">Behavioral Analysis, AI Summaries &amp; P&amp;L History</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DISCIPLINE TAB ── */}
      {activeTab === "discipline" && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm text-gray-500">Win Rate</p>
                <p className="text-xl font-semibold">{winRate.toFixed(1)}%</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm text-gray-500">SL Modified</p>
                <p className="text-xl font-semibold">{slModCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm text-gray-500">SL Removed</p>
                <p className="text-xl font-semibold text-red-500">{slRemCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm text-gray-500">Discipline Score</p>
                <p className="text-xl font-semibold text-blue-600">{disciplineScore}/100</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <DisciplineTrend data={[]} />
              <StabilityRadar />
            </div>
            <div className="space-y-6">
              <ViolationCard />
              <ParticipationCard progress={disciplineScore} />
            </div>
          </div>
        </div>
      )}

      {/* ── SUMMARIES TAB ── */}
      {activeTab === "summaries" && <SummariesTab />}

      {/* ── P&L HISTORY TAB ── */}
      {activeTab === "pnl-history" && <PnLHistoryTab />}
    </main>
  );
}