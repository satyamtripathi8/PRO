import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Clock, Lock, Globe, ChevronRight, RefreshCw, Star, Timer } from 'lucide-react';
import { competitionsApi } from '../lib/api';

function timeRemaining(target: string): { text: string; urgent: boolean } {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return { text: 'Ended', urgent: true };
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0)  return { text: `${d}d ${h % 24}h left`, urgent: false };
  if (h > 0)  return { text: `${h}h ${m % 60}m left`, urgent: h < 3 };
  return { text: `${m}m left`, urgent: true };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPCOMING: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    COMPLETED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.UPCOMING}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return type === 'PAID' ? (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
      PAID
    </span>
  ) : (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      FREE
    </span>
  );
}

function CompetitionCard({ comp, onEnter }: { comp: any; onEnter: (id: string) => void }) {
  const now = new Date();
  const start = new Date(comp.startTime);
  const end = new Date(comp.endTime);
  const participantCount = comp._count?.participants ?? 0;
  const isFull = comp.maxParticipants && participantCount >= comp.maxParticipants;
  const slotPct = comp.maxParticipants ? Math.min(100, (participantCount / comp.maxParticipants) * 100) : null;
  const remaining = comp.status === 'ACTIVE' ? timeRemaining(comp.endTime) : null;
  const deadlineSoon = comp.registrationDeadline && new Date(comp.registrationDeadline) > now
    && (new Date(comp.registrationDeadline).getTime() - now.getTime()) < 3 * 60 * 60 * 1000;

  return (
    <div
      className={`bg-slate-800 border rounded-xl p-5 flex flex-col gap-4 hover:border-sky-500/50 transition-all cursor-pointer ${
        isFull ? 'border-slate-600 opacity-70' : 'border-slate-700'
      }`}
      onClick={() => onEnter(comp.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={comp.status} />
          <TypeBadge type={comp.type} />
          {comp.allowedDomains?.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
              <Lock size={10} /> Restricted
            </span>
          )}
          {isFull && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              FULL
            </span>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
      </div>

      {/* Title */}
      <div>
        <h3 className="text-white font-semibold text-base leading-tight">{comp.title}</h3>
        {comp.description && (
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{comp.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-900/50 rounded-lg p-2">
          <div className="text-sky-400 font-semibold text-sm">
            ₹{Number(comp.startingCapital ?? 100000).toLocaleString('en-IN')}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">Capital</div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <div className="text-white font-semibold text-sm flex items-center justify-center gap-1">
            <Users size={12} className="text-slate-400" />
            {participantCount}
            {comp.maxParticipants ? `/${comp.maxParticipants}` : ''}
          </div>
          {slotPct !== null ? (
            <div className="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${slotPct >= 90 ? 'bg-red-500' : slotPct >= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${slotPct}%` }}
              />
            </div>
          ) : (
            <div className="text-slate-500 text-xs mt-0.5">Participants</div>
          )}
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <div className="text-amber-400 font-semibold text-sm">
            {comp.type === 'PAID' ? `₹${Number(comp.entryFee ?? 0).toLocaleString('en-IN')}` : 'Free'}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">Entry</div>
        </div>
      </div>

      {/* Time / prize row */}
      <div className="flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1 ${remaining?.urgent ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
          {remaining ? (
            <><Timer size={11} />{remaining.text}</>
          ) : (
            <><Clock size={11} />
            {comp.status === 'UPCOMING'
              ? `Starts ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : `Ends ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </>
          )}
        </div>
        {comp.prizePool && (
          <div className="flex items-center gap-1 text-amber-400">
            <Star size={11} />
            ₹{Number(comp.prizePool).toLocaleString('en-IN')}
          </div>
        )}
      </div>

      {/* Registration deadline warning */}
      {deadlineSoon && (
        <div className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 flex items-center gap-1">
          <Timer size={9} /> Registration closes soon
        </div>
      )}

      {/* Domain info */}
      {comp.allowedDomains?.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-violet-400">
          <Globe size={11} />
          {comp.allowedDomains.map((d: any) => d.domain).join(', ')}
        </div>
      )}
    </div>
  );
}

export default function CompetitionsPage() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<any[]>([]);
  const [tab, setTab] = useState<'open' | 'mine'>('open');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [openRes, myRes] = await Promise.all([
        competitionsApi.list(),
        competitionsApi.my().catch(() => ({ data: [] })),
      ]);
      setCompetitions(openRes.data ?? []);
      setMyCompetitions((myRes.data ?? []).map((p: any) => p.competition));
    } catch {
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const displayed = tab === 'open' ? competitions : myCompetitions;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 rounded-xl">
            <Trophy size={22} className="text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Competitions</h1>
            <p className="text-slate-400 text-sm">Compete. Win. Grow.</p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 mb-6 w-fit">
        {(['open', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
              tab === t ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'open' ? 'Open' : 'My Competitions'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-52 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Trophy size={40} className="mb-3 opacity-30" />
          <p className="text-sm">
            {tab === 'open' ? 'No open competitions right now.' : "You haven't joined any competitions yet."}
          </p>
          {tab === 'mine' && (
            <button
              onClick={() => setTab('open')}
              className="mt-4 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Browse Open Competitions
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((comp) => (
            <CompetitionCard
              key={comp.id}
              comp={comp}
              onEnter={(id) => navigate(`/Home/competitions/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
