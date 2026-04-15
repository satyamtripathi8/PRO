import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy, Users, Clock, Lock, Globe, ArrowLeft,
  TrendingUp, Star, BarChart3, Timer, AlertTriangle,
} from 'lucide-react';
import { competitionsApi } from '../lib/api';

function useCountdown(target?: string) {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setText('Ended'); setUrgent(true); return; }
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      setUrgent(h < 2 && d === 0);
      if (d > 0)      setText(`${d}d ${h % 24}h`);
      else if (h > 0) setText(`${h}h ${m % 60}m`);
      else if (m > 0) setText(`${m}m ${s % 60}s`);
      else            setText(`${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  return { text, urgent };
}

declare const Razorpay: any;

function fmtINR(val: number | string) {
  return `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPCOMING: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    COMPLETED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? ''}`}>
      {status}
    </span>
  );
}

function LeaderboardTab({ competitionId, isActive }: { competitionId: string; isActive: boolean }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetch = () =>
      competitionsApi.leaderboard(competitionId)
        .then((r) => { setEntries(r.data?.participants ?? r.data ?? []); setLastUpdated(new Date()); })
        .catch(() => {})
        .finally(() => setLoading(false));
    fetch();
    // Auto-refresh every 20 s when competition is live
    if (!isActive) return;
    const t = setInterval(fetch, 20_000);
    return () => clearInterval(t);
  }, [competitionId, isActive]);

  if (loading) return <div className="text-slate-500 text-sm text-center py-10">Loading leaderboard…</div>;
  if (entries.length === 0)
    return <div className="text-slate-500 text-sm text-center py-10">No participants yet.</div>;

  return (
    <div className="overflow-x-auto">
      {lastUpdated && isActive && (
        <div className="text-[10px] text-slate-600 text-right mb-2">
          Live · updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500 border-b border-slate-700">
            <th className="text-left py-2 pr-4">Rank</th>
            <th className="text-left py-2 pr-4">Trader</th>
            <th className="text-right py-2 pr-4">P&L</th>
            <th className="text-right py-2 pr-4">Trades</th>
            <th className="text-right py-2">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, idx) => {
            const rank = idx + 1;
            const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const pnl = Number(e.totalPnL ?? 0);
            const winRate = e.totalTrades > 0 ? ((e.winCount / e.totalTrades) * 100).toFixed(0) : '0';
            return (
              <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-2.5 pr-4 font-bold text-base">{rankIcon}</td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    {e.user?.image ? (
                      <img src={e.user.image} className="w-6 h-6 rounded-full" alt="" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-sky-500/30 flex items-center justify-center text-sky-400 text-xs">
                        {(e.user?.name ?? '?')[0]}
                      </div>
                    )}
                    <span className="text-white">{e.user?.name ?? 'Unknown'}</span>
                  </div>
                </td>
                <td className={`py-2.5 pr-4 text-right font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnl >= 0 ? '+' : ''}{fmtINR(pnl)}
                </td>
                <td className="py-2.5 pr-4 text-right text-slate-300">{e.totalTrades}</td>
                <td className="py-2.5 text-right text-slate-300">{winRate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MyStatsTab({ competitionId, navigate, competitionStatus }: {
  competitionId: string;
  navigate: ReturnType<typeof useNavigate>;
  competitionStatus: string;
}) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    competitionsApi.myStats(competitionId)
      .then((r) => setStats(r.data))
      .catch((e) => setErr(e.message ?? 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [competitionId]);

  if (loading) return <div className="text-slate-500 text-sm text-center py-10">Loading…</div>;
  if (err) return <div className="text-slate-500 text-sm text-center py-10">{err}</div>;
  if (!stats) return null;

  const pnl = Number(stats.totalPnL ?? 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Current Balance', value: fmtINR(stats.currentBalance), color: 'text-sky-400' },
          { label: 'Total P&L', value: `${pnl >= 0 ? '+' : ''}${fmtINR(pnl)}`, color: pnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Return', value: `${pnl >= 0 ? '+' : ''}${stats.returnPct}%`, color: pnl >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Total Trades', value: stats.totalTrades, color: 'text-white' },
          { label: 'Wins', value: stats.winCount, color: 'text-green-400' },
          { label: 'Losses', value: stats.lossCount, color: 'text-red-400' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-900/60 rounded-xl p-3 text-center">
            <div className={`font-bold text-lg ${item.color}`}>{item.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 rounded-xl p-3 text-center">
        <div className="text-amber-400 font-bold text-2xl">#{stats.rank}</div>
        <div className="text-slate-500 text-xs mt-0.5">Current Rank</div>
      </div>

      {competitionStatus === 'ACTIVE' && (
        <button
          onClick={() => navigate(`/Home/competitions/${competitionId}/trade`)}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white font-medium py-2.5 rounded-xl transition-colors"
        >
          Trade Now
        </button>
      )}
    </div>
  );
}

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'leaderboard' | 'my-stats'>('overview');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState(false);

  const endCountdown   = useCountdown(competition?.endTime);
  const startCountdown = useCountdown(competition?.startTime);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await competitionsApi.get(id);
      setCompetition(res.data);
      if (res.data?.myParticipation) setJoined(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleJoinFree = async () => {
    if (!id) return;
    setJoining(true);
    setJoinError('');
    try {
      await competitionsApi.join(id);
      setJoined(true);
      setTab('my-stats');
      load();
    } catch (e: any) {
      setJoinError(e.message ?? 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleJoinPaid = async () => {
    if (!id) return;
    setJoining(true);
    setJoinError('');
    try {
      const res = await competitionsApi.initiatePayment(id);
      const { razorpayOrderId, amount, key } = res.data;

      const rzp = new Razorpay({
        key,
        amount,
        currency: 'INR',
        order_id: razorpayOrderId,
        name: competition?.title ?? 'Competition Entry',
        description: 'Competition entry fee',
        handler: async (response: any) => {
          try {
            await competitionsApi.verifyPayment(id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            setJoined(true);
            setTab('my-stats');
            load();
          } catch (e: any) {
            setJoinError(e.message ?? 'Payment verification failed');
          } finally {
            setJoining(false);
          }
        },
        modal: {
          ondismiss: () => setJoining(false),
        },
        theme: { color: '#0ea5e9' },
      });
      rzp.open();
    } catch (e: any) {
      setJoinError(e.message ?? 'Failed to initiate payment');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Competition not found.
      </div>
    );
  }

  const participantCount = competition._count?.participants ?? 0;
  const isFull = competition.maxParticipants && participantCount >= competition.maxParticipants;
  const isOpen =
    competition.status === 'UPCOMING' || competition.status === 'ACTIVE';
  const canJoin = isOpen && !joined && !isFull;
  const deadlinePassed =
    competition.registrationDeadline && new Date() > new Date(competition.registrationDeadline);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/Home/competitions')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-white truncate">{competition.title}</h1>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        {/* Status + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={competition.status} />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            competition.type === 'PAID'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {competition.type}
          </span>
          {competition.allowedDomains?.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
              <Lock size={10} /> Domain Restricted
            </span>
          )}
        </div>

        {/* Live countdown banner */}
        {competition.status === 'ACTIVE' && endCountdown.text && (
          <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${
            endCountdown.urgent
              ? 'bg-red-900/30 border-red-600/40 text-red-300'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Timer size={14} />
              Competition ends in
            </div>
            <span className={`font-bold text-base tabular-nums ${endCountdown.urgent ? 'text-red-300 animate-pulse' : 'text-white'}`}>
              {endCountdown.text}
            </span>
          </div>
        )}
        {competition.status === 'UPCOMING' && startCountdown.text && (
          <div className="flex items-center justify-between rounded-xl px-4 py-2.5 border bg-sky-900/20 border-sky-700/40 text-sky-300">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Timer size={14} />
              Starts in
            </div>
            <span className="font-bold text-base tabular-nums text-sky-200">{startCountdown.text}</span>
          </div>
        )}

        {/* Description */}
        {competition.description && (
          <p className="text-slate-400 text-sm leading-relaxed">{competition.description}</p>
        )}

        {/* Key info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: <BarChart3 size={14} />, label: 'Starting Capital', value: fmtINR(competition.startingCapital ?? 100000) },
            { icon: <Users size={14} />, label: 'Participants', value: `${participantCount}${competition.maxParticipants ? `/${competition.maxParticipants}` : ''}` },
            { icon: <Star size={14} />, label: 'Entry Fee', value: competition.type === 'PAID' ? fmtINR(competition.entryFee ?? 0) : 'Free' },
            { icon: <Clock size={14} />, label: 'Start', value: fmtDate(competition.startTime) },
            { icon: <Clock size={14} />, label: 'End', value: fmtDate(competition.endTime) },
            competition.prizePool
              ? { icon: <Trophy size={14} />, label: 'Prize Pool', value: fmtINR(competition.prizePool) }
              : null,
          ].filter(Boolean).map((item: any) => (
            <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center gap-1 text-slate-500 text-xs mb-1">
                {item.icon} {item.label}
              </div>
              <div className="text-white text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Domain restriction info */}
        {competition.allowedDomains?.length > 0 && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 flex items-start gap-2">
            <Globe size={14} className="text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-violet-300 text-sm font-medium">Domain Restricted</div>
              <div className="text-violet-400/70 text-xs mt-0.5">
                Only users with: {competition.allowedDomains.map((d: any) => `@${d.domain}`).join(', ')} can join.
              </div>
            </div>
          </div>
        )}

        {/* Prize rules */}
        {competition.prizeRules && Object.keys(competition.prizeRules).length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 text-amber-400 font-medium text-sm">
              <Trophy size={14} /> Prize Distribution
            </div>
            <div className="space-y-1.5">
              {Object.entries(competition.prizeRules).map(([pos, val]) => (
                <div key={pos} className="flex justify-between text-sm">
                  <span className="text-slate-400">{pos} Place</span>
                  <span className="text-amber-300 font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join section */}
        {joined ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm font-medium text-center">
            ✓ You are registered for this competition!
          </div>
        ) : canJoin && !deadlinePassed ? (
          <div className="space-y-2">
            {/* Late-joiner warning for already-active competitions */}
            {competition.status === 'ACTIVE' && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-xs leading-relaxed">
                  This competition has already started. Other participants have a head start — you will have less time to trade.
                </p>
              </div>
            )}
            {joinError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3">
                {joinError}
              </div>
            )}
            <button
              disabled={joining}
              onClick={competition.type === 'FREE' ? handleJoinFree : handleJoinPaid}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {joining ? 'Processing…' : competition.type === 'FREE' ? 'Join for Free' : `Pay ₹${Number(competition.entryFee ?? 0).toLocaleString('en-IN')} & Join`}
            </button>
          </div>
        ) : !isOpen ? (
          <div className="text-center text-slate-500 text-sm">
            {competition.status === 'COMPLETED' ? 'Competition has ended.' : `Competition is ${competition.status.toLowerCase()}.`}
          </div>
        ) : isFull ? (
          <div className="text-center text-red-400 text-sm">Competition is full.</div>
        ) : deadlinePassed ? (
          <div className="text-center text-slate-500 text-sm">Registration deadline has passed.</div>
        ) : null}

        {/* Trade button for active participants */}
        {joined && competition.status === 'ACTIVE' && (
          <button
            onClick={() => navigate(`/Home/competitions/${id}/trade`)}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <TrendingUp size={16} /> Trade Now
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 w-fit">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'leaderboard', label: 'Leaderboard' },
            ...(joined ? [{ key: 'my-stats', label: 'My Stats' }] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                tab === t.key ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'leaderboard' && <LeaderboardTab competitionId={id!} isActive={competition.status === 'ACTIVE'} />}
        {tab === 'my-stats' && joined && (
          <MyStatsTab competitionId={id!} navigate={navigate} competitionStatus={competition.status} />
        )}
        {tab === 'overview' && (
          <div className="text-slate-400 text-sm leading-relaxed">
            {competition.description || 'No additional details provided.'}
          </div>
        )}
      </div>
    </div>
  );
}
