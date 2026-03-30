import React, { useState, useEffect, useCallback } from 'react';

const baseUrl = import.meta.env.VITE_API_URL || '';
const API = baseUrl ? `${baseUrl}/api` : '/api';

// ─── API helpers ─────────────────────────────────────────────────────────────
async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    ...opts,
  });
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TokenStatus {
  hasToken: boolean;
  isExpired: boolean;
  expiresIn: number | null;
  expiresAt: number | null;
  expiresInMinutes: number | null;
  expiresAtISO: string | null;
}

interface AdminAnalytics {
  totalUsers: number;
  activeTraders: number;
  totalTrades: number;
  recentTrades: number;
  totalBehaviorEvents: number;
  avgDisciplineScore: number;
  violationsByType: { eventType: string; severity: string; _count: { id: number } }[];
  tokenStatus: TokenStatus;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}33`, borderRadius: 12, padding: '20px 24px', minWidth: 160 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
  );
}

// ─── Token Manager Tab ────────────────────────────────────────────────────────
function TokenManagerTab() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchStatus = useCallback(async () => {
    const r = await api('/admin/token/status');
    if (r.success) setStatus(r.data);
  }, []);

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 30000); return () => clearInterval(t); }, [fetchStatus]);

  const handleUpdate = async () => {
    if (!newToken.trim()) return;
    setLoading(true); setMsg(null);
    const r = await api('/admin/token', {
      method: 'POST',
      body: JSON.stringify({ accessToken: newToken.trim() }),
    });
    setLoading(false);
    if (r.success) {
      setMsg({ text: '✅ Token updated and validated successfully!', ok: true });
      setNewToken('');
      fetchStatus();
    } else {
      setMsg({ text: `❌ ${r.message || 'Update failed'}`, ok: false });
    }
  };

  const expiry = status?.expiresInMinutes ?? null;
  const tokenColor = !status?.hasToken ? '#ef4444' : status.isExpired ? '#ef4444' : expiry !== null && expiry < 60 ? '#f59e0b' : '#22c55e';
  const tokenLabel = !status?.hasToken ? '⛔ No Token' : status.isExpired ? '🔴 Expired' : expiry !== null && expiry < 60 ? '⚠️ Expiring Soon' : '🟢 Valid';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current Status */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: 16, fontSize: 16 }}>Current Token Status</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge text={tokenLabel} color={tokenColor} />
          {status?.expiresAtISO && (
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              Expires: {new Date(status.expiresAtISO).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </span>
          )}
          {expiry !== null && !status?.isExpired && (
            <span style={{ color: tokenColor, fontSize: 13, fontWeight: 600 }}>
              {expiry >= 60 ? `${Math.floor(expiry / 60)}h ${expiry % 60}m remaining` : `${expiry}m remaining`}
            </span>
          )}
        </div>
      </div>

      {/* Token Input */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: 16, fontSize: 16 }}>Update Access Token</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          Paste your fresh Upstox access token below. It will be validated against the Upstox API before saving.
        </p>
        <textarea
          value={newToken}
          onChange={e => setNewToken(e.target.value)}
          placeholder="Paste Upstox access token here..."
          rows={4}
          style={{
            width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, color: '#e2e8f0', padding: '12px 14px', fontSize: 13,
            fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
          <button
            onClick={handleUpdate}
            disabled={loading || !newToken.trim()}
            style={{
              background: loading ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px',
              fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: !newToken.trim() ? 0.5 : 1,
            }}
          >
            {loading ? '⏳ Validating...' : '🔄 Update Token'}
          </button>
          {msg && (
            <span style={{ color: msg.ok ? '#22c55e' : '#ef4444', fontSize: 13 }}>{msg.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  useEffect(() => {
    api('/admin/analytics').then(r => { if (r.success) setData(r.data); });
  }, []);

  if (!data) return <LoadingSpinner />;

  const severityColor = (s: string) => s === 'CRITICAL' ? '#ef4444' : s === 'HIGH' ? '#f97316' : s === 'MEDIUM' ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard label="Total Users" value={data.totalUsers} color="#6366f1" />
        <StatCard label="Active Traders (7d)" value={data.activeTraders} color="#22c55e" />
        <StatCard label="Total Trades" value={data.totalTrades} sub={`${data.recentTrades} this week`} color="#3b82f6" />
        <StatCard label="Behavior Events" value={data.totalBehaviorEvents} color="#f59e0b" />
        <StatCard label="Avg Discipline Score" value={`${data.avgDisciplineScore}/100`} color="#8b5cf6" />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: 16, fontSize: 16 }}>Violations Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.violationsByType.slice(0, 10).map((v, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              <span style={{ color: '#e2e8f0', fontSize: 13 }}>{v.eventType}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge text={v.severity} color={severityColor(v.severity)} />
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{v._count.id} events</span>
              </div>
            </div>
          ))}
          {data.violationsByType.length === 0 && <span style={{ color: '#64748b', fontSize: 13 }}>No violations recorded</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Traders Tab ──────────────────────────────────────────────────────────────
function TradersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (search) params.set('search', search);
    const r = await api(`/admin/users?${params}`);
    if (r.success) { setUsers(r.data.users); setTotal(r.data.total); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by email, name, or ID..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', padding: '10px 14px', fontSize: 13 }}
        />
        <button onClick={fetch} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>🔍</button>
      </div>
      <Table
        columns={['Name', 'Email', 'Role', 'Orders', 'Behavior Events', 'Joined']}
        rows={users.map(u => [
          u.name || '—',
          u.email,
          <Badge key={u.id} text={u.role} color={u.role === 'ADMIN' ? '#f59e0b' : '#6366f1'} />,
          u._count.orders,
          u._count.behaviorEvents,
          new Date(u.createdAt).toLocaleDateString('en-IN'),
        ])}
        loading={loading}
      />
      <Pagination page={page} total={total} limit={20} onPage={setPage} />
    </div>
  );
}

// ─── Trades Tab ───────────────────────────────────────────────────────────────
function TradesTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', symbol: '', dateFrom: '', dateTo: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '20' });
    if (filters.status) params.set('status', filters.status);
    if (filters.symbol) params.set('symbol', filters.symbol);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    const r = await api(`/admin/trades?${params}`);
    if (r.success) { setOrders(r.data.orders); setTotal(r.data.total); }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const pnlColor = (pnl: number | null) => pnl == null ? '#94a3b8' : pnl >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {['symbol', 'dateFrom', 'dateTo'].map(k => (
          <input key={k} placeholder={k === 'symbol' ? 'Symbol' : k === 'dateFrom' ? 'From (YYYY-MM-DD)' : 'To (YYYY-MM-DD)'}
            value={(filters as any)[k]}
            onChange={e => { setFilters(f => ({ ...f, [k]: e.target.value })); setPage(1); }}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 13, width: 160 }}
          />
        ))}
        <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 13 }}>
          <option value="">All Status</option>
          {['PENDING', 'FILLED', 'CANCELLED', 'REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetch} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Apply</button>
      </div>
      <Table
        columns={['User', 'Symbol', 'Side', 'Status', 'Qty', 'Entry', 'PnL', 'Score', 'Date']}
        rows={orders.map(o => [
          o.user?.email?.split('@')[0] || '—',
          o.symbol,
          <Badge key={`${o.id}-s`} text={o.side} color={o.side === 'BUY' ? '#22c55e' : '#ef4444'} />,
          <Badge key={`${o.id}-st`} text={o.status} color={o.status === 'FILLED' ? '#22c55e' : o.status === 'CANCELLED' ? '#94a3b8' : '#f59e0b'} />,
          Number(o.quantity),
          `₹${Number(o.entryPrice).toFixed(2)}`,
          <span key={`${o.id}-pnl`} style={{ color: pnlColor(o.pnl) }}>{o.pnl != null ? `₹${Number(o.pnl).toFixed(2)}` : '—'}</span>,
          o.tradeAnalysis?.score ?? '—',
          new Date(o.createdAt).toLocaleDateString('en-IN'),
        ])}
        loading={loading}
      />
      <Pagination page={page} total={total} limit={20} onPage={setPage} />
    </div>
  );
}

// ─── Behavior Events Tab ──────────────────────────────────────────────────────
function BehaviorTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '25' });
    if (severity) params.set('severity', severity);
    const r = await api(`/admin/behavior-events?${params}`);
    if (r.success) { setEvents(r.data.events); setTotal(r.data.total); }
    setLoading(false);
  }, [page, severity]);

  useEffect(() => { fetch(); }, [fetch]);
  const sColor = (s: string) => s === 'CRITICAL' ? '#ef4444' : s === 'HIGH' ? '#f97316' : s === 'MEDIUM' ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 13 }}>
          <option value="">All Severities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetch} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Apply</button>
      </div>
      <Table
        columns={['User', 'Event Type', 'Severity', 'Time']}
        rows={events.map(e => [
          e.user?.email?.split('@')[0] || '—',
          e.eventType,
          <Badge key={e.id} text={e.severity} color={sColor(e.severity)} />,
          new Date(e.createdAt).toLocaleString('en-IN'),
        ])}
        loading={loading}
      />
      <Pagination page={page} total={total} limit={25} onPage={setPage} />
    </div>
  );
}

// ─── Chat Logs Tab ────────────────────────────────────────────────────────────
function ChatLogsTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const r = await api(`/admin/chat-logs?page=${page}&limit=20`);
    if (r.success) { setMessages(r.data.messages); setTotal(r.data.total); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  const roleColor = (r: string) => r === 'USER' ? '#6366f1' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Table
        columns={['User', 'Role', 'Intent', 'Message', 'Time']}
        rows={messages.map(m => [
          m.user?.email?.split('@')[0] || '—',
          <Badge key={m.id + 'r'} text={m.role} color={roleColor(m.role)} />,
          m.intentType,
          <span key={m.id + 'm'} style={{ color: '#cbd5e1', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{m.content}</span>,
          new Date(m.createdAt).toLocaleString('en-IN'),
        ])}
        loading={loading}
      />
      <Pagination page={page} total={total} limit={20} onPage={setPage} />
    </div>
  );
}

// ─── Summaries Tab ────────────────────────────────────────────────────────────
function SummariesTab() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    const r = await api(`/admin/summaries?${params}`);
    if (r.success) setSummaries(r.data);
    setLoading(false);
  }, [type]);

  useEffect(() => { fetch(); }, [fetch]);

  const typeColor = (t: string) => t === 'daily' ? '#3b82f6' : t === 'weekly' ? '#8b5cf6' : '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <select value={type} onChange={e => { setType(e.target.value); }}
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 13 }}>
          <option value="">All Types</option>
          {['daily', 'weekly', 'monthly'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <button onClick={fetch} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Apply</button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summaries.map(s => (
            <div key={s.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
              <div
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Badge text={s.type} color={typeColor(s.type)} />
                  <span style={{ color: '#e2e8f0', fontSize: 13 }}>{s.user?.email}</span>
                </div>
                <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(s.updatedAt).toLocaleDateString('en-IN')}</span>
              </div>
              {expanded === s.id && (
                <pre style={{ background: 'rgba(0,0,0,0.3)', color: '#94a3b8', fontSize: 12, padding: 16, margin: 0, overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(s.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {summaries.length === 0 && <span style={{ color: '#64748b' }}>No summaries found</span>}
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function Table({ columns, rows, loading }: { columns: string[]; rows: React.ReactNode[][]; loading?: boolean }) {
  return (
    <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {columns.map(c => (
              <th key={c} style={{ padding: '10px 14px', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: '#cbd5e1', fontSize: 13 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
        style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
      <span style={{ color: '#94a3b8', fontSize: 13 }}>{page} / {pages} ({total} total)</span>
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
        style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', opacity: page === pages ? 0.4 : 1 }}>→</button>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
const TABS = [
  { key: 'analytics', label: '📊 Analytics' },
  { key: 'token', label: '🔑 Token Manager' },
  { key: 'traders', label: '👥 Traders' },
  { key: 'trades', label: '📈 Trades' },
  { key: 'behavior', label: '🧠 Behavior' },
  { key: 'chat', label: '💬 Chat Logs' },
  { key: 'summaries', label: '📋 Summaries' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('analytics');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 24, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>Admin Dashboard</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>System Management</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: tab === t.key ? '#818cf8' : '#64748b',
                border: 'none', borderRadius: 8, padding: '8px 14px',
                fontWeight: tab === t.key ? 600 : 400, fontSize: 13,
                cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: tab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                transition: 'all 0.2s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '32px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{TABS.find(t => t.key === tab)?.label}</h1>
          <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>
            {tab === 'analytics' && 'System-wide performance overview'}
            {tab === 'token' && 'Manage Upstox API access token'}
            {tab === 'traders' && 'View and manage all registered traders'}
            {tab === 'trades' && 'All trades across the platform'}
            {tab === 'behavior' && 'Real-time behavioral events and triggers'}
            {tab === 'chat' && 'AI mentor conversation logs'}
            {tab === 'summaries' && 'Performance summaries cache'}
          </p>
        </div>

        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'token' && <TokenManagerTab />}
        {tab === 'traders' && <TradersTab />}
        {tab === 'trades' && <TradesTab />}
        {tab === 'behavior' && <BehaviorTab />}
        {tab === 'chat' && <ChatLogsTab />}
        {tab === 'summaries' && <SummariesTab />}
      </div>
    </div>
  );
}
