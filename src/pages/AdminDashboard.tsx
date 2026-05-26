import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../lib/config';

const API = `${API_BASE_URL}/api`;

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

// ─── Shared form fields config ────────────────────────────────────────────────
const COMP_FIELDS = [
  { label: 'Title *', key: 'title', type: 'text', placeholder: 'e.g. JIET Intraday Challenge' },
  { label: 'Type', key: 'type', type: 'select', options: ['FREE', 'PAID'] },
  { label: 'Start Time *', key: 'startTime', type: 'datetime-local' },
  { label: 'End Time *', key: 'endTime', type: 'datetime-local' },
  { label: 'Reg. Deadline', key: 'registrationDeadline', type: 'datetime-local' },
  { label: 'Entry Fee (₹)', key: 'entryFee', type: 'number', placeholder: 'Leave blank for free' },
  { label: 'Prize Pool (₹)', key: 'prizePool', type: 'number', placeholder: 'Optional' },
  { label: 'Starting Capital (₹)', key: 'startingCapital', type: 'number', placeholder: '100000' },
  { label: 'Max Participants', key: 'maxParticipants', type: 'number', placeholder: 'Unlimited' },
  { label: 'Allowed Domains (comma-sep)', key: 'allowedDomains', type: 'text', placeholder: 'jietjodhpur.ac.in, iitj.ac.in' },
];

const BLANK_FORM = {
  title: '', description: '', type: 'FREE', startTime: '', endTime: '',
  registrationDeadline: '', entryFee: '', prizePool: '', startingCapital: '100000',
  maxParticipants: '', allowedDomains: '',
};

function toISO(dt: string) {
  return dt ? new Date(dt).toISOString() : dt;
}

function buildPayload(form: typeof BLANK_FORM) {
  const payload: any = {
    title: form.title,
    description: form.description || undefined,
    type: form.type,
    startTime: toISO(form.startTime),
    endTime: toISO(form.endTime),
    startingCapital: Number(form.startingCapital) || 100000,
  };
  if (form.registrationDeadline) payload.registrationDeadline = toISO(form.registrationDeadline);
  if (form.entryFee) payload.entryFee = Number(form.entryFee);
  if (form.prizePool) payload.prizePool = Number(form.prizePool);
  if (form.maxParticipants) payload.maxParticipants = Number(form.maxParticipants);
  if (form.allowedDomains.trim())
    payload.allowedDomains = form.allowedDomains.split(',').map((d: string) => d.trim()).filter(Boolean);
  return payload;
}

function fmtDt(iso: string) {
  return iso ? iso.slice(0, 16) : ''; // trim to datetime-local format
}

const COMP_INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// ─── Participant Panel ────────────────────────────────────────────────────────
function ParticipantPanel({ comp, onClose }: { comp: any; onClose: () => void }) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disqMsg, setDisqMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api(`/competitions/${comp.id}/participants?limit=100`);
    setParticipants(r.data?.data ?? []);
    setLoading(false);
  }, [comp.id]);

  useEffect(() => { load(); }, [load]);

  const handleDisqualify = async (userId: string) => {
    if (!window.confirm('Disqualify this participant? They will no longer be able to trade.')) return;
    const r = await api(`/competitions/${comp.id}/disqualify/${userId}`, { method: 'POST' });
    setDisqMsg(prev => ({ ...prev, [userId]: r.success ? 'Disqualified' : r.message ?? 'Failed' }));
    if (r.success) load();
  };

  const statusCls: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
    REGISTERED: 'bg-sky-100 text-sky-700 border border-sky-200',
    COMPLETED: 'bg-gray-100 text-gray-600 border border-gray-200',
    DISQUALIFIED: 'bg-red-100 text-red-700 border border-red-200',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">Participants — {comp.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{participants.length} registered</div>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">✕ Close</button>
        </div>
        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading…</div>
          ) : participants.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No participants yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Trader</th>
                  <th className="text-right py-2 px-3">Balance</th>
                  <th className="text-right py-2 px-3">P&L</th>
                  <th className="text-right py-2 px-3">Trades</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-center py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p: any, idx: number) => {
                  const pnl = Number(p.totalPnL ?? 0);
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-800">{p.user?.name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{p.user?.email}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700">₹{Number(p.currentBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3 px-3 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500">{p.totalTrades}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.status !== 'DISQUALIFIED' && p.status !== 'COMPLETED' ? (
                          <button onClick={() => handleDisqualify(p.userId)} className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50">Disqualify</button>
                        ) : (
                          <span className="text-xs text-gray-400">{disqMsg[p.userId] ?? '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Competition Modal ───────────────────────────────────────────────────
function EditCompModal({ comp, onClose, onSaved }: { comp: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<typeof BLANK_FORM>({
    title: comp.title ?? '',
    description: comp.description ?? '',
    type: comp.type ?? 'FREE',
    startTime: fmtDt(comp.startTime),
    endTime: fmtDt(comp.endTime),
    registrationDeadline: comp.registrationDeadline ? fmtDt(comp.registrationDeadline) : '',
    entryFee: comp.entryFee ? String(Number(comp.entryFee)) : '',
    prizePool: comp.prizePool ? String(Number(comp.prizePool)) : '',
    startingCapital: comp.startingCapital ? String(Number(comp.startingCapital)) : '100000',
    maxParticipants: comp.maxParticipants ? String(comp.maxParticipants) : '',
    allowedDomains: comp.allowedDomains?.map((d: any) => d.domain).join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const r = await api(`/competitions/${comp.id}`, { method: 'PATCH', body: JSON.stringify(buildPayload(form)) });
    setSaving(false);
    if (r.success) {
      setMsg({ text: 'Saved!', ok: true });
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } else {
      setMsg({ text: r.message ?? 'Save failed', ok: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Edit Competition <span className="text-xs font-normal text-gray-400 ml-1">(DRAFT only)</span></div>
          <button onClick={onClose} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">✕ Close</button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {COMP_FIELDS.map((field: any) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={COMP_INPUT}>
                    {field.options.map((o: string) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={(form as any)[field.key]} placeholder={field.placeholder}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={COMP_INPUT} />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className={`${COMP_INPUT} resize-y`} />
          </div>
          {msg && <div className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</div>}
          <div className="flex gap-3 pt-1">
            <button disabled={saving} onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 font-semibold text-sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose} className="border border-gray-200 text-gray-600 rounded-lg px-5 py-2 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Competitions Admin Tab ───────────────────────────────────────────────────
function CompetitionsAdminTab() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [formMsg, setFormMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [statusMsg, setStatusMsg] = useState<Record<string, string>>({});
  const [editComp, setEditComp] = useState<any>(null);
  const [participantComp, setParticipantComp] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await api('/competitions/admin/all?limit=50');
    setCompetitions(r.data?.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.startTime) { setFormMsg({ text: 'Please select a start date & time', ok: false }); return; }
    if (!form.endTime) { setFormMsg({ text: 'Please select an end date & time', ok: false }); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { setFormMsg({ text: 'End time must be after start time', ok: false }); return; }
    setCreating(true); setFormMsg(null);
    const r = await api('/competitions', { method: 'POST', body: JSON.stringify(buildPayload(form)) });
    setCreating(false);
    if (r.success) {
      setFormMsg({ text: 'Competition created!', ok: true });
      setForm({ ...BLANK_FORM });
      load();
    } else {
      const detail = r.details?.map((d: any) => `${d.field}: ${d.message}`).join(', ');
      setFormMsg({ text: detail ? `${r.message} — ${detail}` : (r.message ?? 'Failed to create'), ok: false });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const r = await api(`/competitions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setStatusMsg(prev => ({ ...prev, [id]: r.success ? `→ ${status}` : r.message ?? 'Failed' }));
    if (r.success) load();
  };

  const statusCls: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 border border-gray-200',
    UPCOMING: 'bg-sky-100 text-sky-700 border border-sky-200',
    ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
    COMPLETED: 'bg-slate-100 text-slate-600 border border-slate-200',
    CANCELLED: 'bg-red-100 text-red-600 border border-red-200',
  };

  return (
    <div className="space-y-6">
      {editComp && <EditCompModal comp={editComp} onClose={() => setEditComp(null)} onSaved={load} />}
      {participantComp && <ParticipantPanel comp={participantComp} onClose={() => setParticipantComp(null)} />}

      {/* Create form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="font-semibold text-gray-800">Create Competition</h3>
          <p className="text-xs text-gray-500 mt-0.5">Fill in the title, then set dates and click Create</p>
        </div>
        <div className="p-6 space-y-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {COMP_FIELDS.map((field: any) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={COMP_INPUT}>
                    {field.options.map((o: string) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={(form as any)[field.key]} placeholder={field.placeholder}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={COMP_INPUT} />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className={`${COMP_INPUT} resize-y`} />
          </div>
          {formMsg && <div className={`text-sm ${formMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{formMsg.text}</div>}
          <button disabled={creating || !form.title} onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 font-semibold text-sm">
            {creating ? 'Creating…' : 'Create Competition'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">All Competitions <span className="text-sm font-normal text-gray-400">({competitions.length})</span></h3>
          <button onClick={load} className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">Refresh</button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading…</div>
          ) : competitions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No competitions yet.</div>
          ) : (
            <div className="space-y-3">
              {competitions.map((comp: any) => (
                <div key={comp.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900">{comp.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(comp.startTime).toLocaleDateString('en-IN')} → {new Date(comp.endTime).toLocaleDateString('en-IN')}
                        &nbsp;·&nbsp; {comp._count?.participants ?? 0} participants
                        {comp.allowedDomains?.length > 0 && ` · 🔒 ${comp.allowedDomains.map((d: any) => d.domain).join(', ')}`}
                        {comp.entryFee && ` · ₹${Number(comp.entryFee).toLocaleString('en-IN')} entry`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[comp.status] ?? 'bg-gray-100 text-gray-600'}`}>{comp.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${comp.type === 'PAID' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{comp.type}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap items-center">
                    {comp.status === 'DRAFT' && (
                      <button onClick={() => handleStatusChange(comp.id, 'UPCOMING')} className="text-xs border border-sky-200 text-sky-600 rounded-md px-3 py-1 hover:bg-sky-50">→ UPCOMING</button>
                    )}
                    {comp.status === 'UPCOMING' && (
                      <button onClick={() => handleStatusChange(comp.id, 'ACTIVE')} className="text-xs border border-green-200 text-green-600 rounded-md px-3 py-1 hover:bg-green-50">→ ACTIVE</button>
                    )}
                    {comp.status === 'ACTIVE' && (
                      <button onClick={() => handleStatusChange(comp.id, 'COMPLETED')} className="text-xs border border-gray-200 text-gray-600 rounded-md px-3 py-1 hover:bg-gray-50">→ COMPLETE</button>
                    )}
                    {['DRAFT', 'UPCOMING', 'ACTIVE'].includes(comp.status) && (
                      <button onClick={() => handleStatusChange(comp.id, 'CANCELLED')} className="text-xs border border-red-200 text-red-500 rounded-md px-3 py-1 hover:bg-red-50">Cancel</button>
                    )}
                    <span className="text-gray-200">|</span>
                    {comp.status === 'DRAFT' && (
                      <button onClick={() => setEditComp(comp)} className="text-xs border border-violet-200 text-violet-600 rounded-md px-3 py-1 hover:bg-violet-50">✏️ Edit</button>
                    )}
                    <button onClick={() => setParticipantComp(comp)} className="text-xs border border-amber-200 text-amber-600 rounded-md px-3 py-1 hover:bg-amber-50">
                      👥 Participants ({comp._count?.participants ?? 0})
                    </button>
                    {statusMsg[comp.id] && <span className="text-xs text-gray-400">{statusMsg[comp.id]}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  { key: 'competitions', label: '🏆 Competitions' },
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
            {tab === 'competitions' && 'Create and manage trading competitions'}
          </p>
        </div>

        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'token' && <TokenManagerTab />}
        {tab === 'traders' && <TradersTab />}
        {tab === 'trades' && <TradesTab />}
        {tab === 'behavior' && <BehaviorTab />}
        {tab === 'chat' && <ChatLogsTab />}
        {tab === 'summaries' && <SummariesTab />}
        {tab === 'competitions' && <CompetitionsAdminTab />}
      </div>
    </div>
  );
}
