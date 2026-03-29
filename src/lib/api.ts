const BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

// ─── Auth ─────────────────────────────────────────────
export const authApi = {
  signup: (data: { email: string; name: string; password: string }) =>
    request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    request<any>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<any>('/auth/me'),

  verifyEmail: (data: { email: string; code: string }) =>
    request<any>('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),

  resendOTP: (data: { email: string }) =>
    request<any>('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Wallet ───────────────────────────────────────────
export const walletApi = {
  get: () =>
    request<any>('/wallet'),

  getHoldings: () =>
    request<any>('/wallet/holdings'),

  deposit: (amount: number) =>
    request<any>('/wallet/deposit', { method: 'POST', body: JSON.stringify({ amount }) }),

  getTransactions: (page = 1, limit = 20) =>
    request<any>(`/wallet/transactions?page=${page}&limit=${limit}`),

  reset: () =>
    request<any>('/wallet/reset', { method: 'POST' }),
};

// ─── Orders ───────────────────────────────────────────
export const ordersApi = {
  place: (data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL_M';
    quantity: number;
    entryPrice: number;
    stopLoss?: number | null;
    triggerPrice?: number | null;
  }) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  close: (orderId: string, exitPrice: number) =>
    request<any>(`/orders/${orderId}/close`, {
      method: 'POST',
      body: JSON.stringify({ exitPrice }),
    }),

  modifyStopLoss: (orderId: string, stopLoss: number | null) =>
    request<any>(`/orders/${orderId}/stop-loss`, {
      method: 'PATCH',
      body: JSON.stringify({ stopLoss }),
    }),

  cancel: (orderId: string) =>
    request<any>(`/orders/${orderId}`, { method: 'DELETE' }),

  list: (params?: { page?: number; limit?: number; status?: string; symbol?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    if (params?.symbol) q.set('symbol', params.symbol);
    return request<any>(`/orders?${q.toString()}`);
  },
};

// ─── Analytics ────────────────────────────────────────
export const analyticsApi = {
  getTrades: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params);
    return request<any>(`/analytics/trades?${q.toString()}`);
  },

  getStats: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params);
    return request<any>(`/analytics/stats?${q.toString()}`);
  },

  getBehavior: (page = 1, limit = 20) =>
    request<any>(`/analytics/behavior?page=${page}&limit=${limit}`),
};

// ─── Leaderboard ──────────────────────────────────────
export const leaderboardApi = {
  get: (filter: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 50) =>
    request<any>(`/leaderboard?filter=${filter}&limit=${limit}`),

  getByReturn: (filter: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 50) =>
    request<any>(`/leaderboard/by-return?filter=${filter}&limit=${limit}`),

  getUserRank: (filter: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time') =>
    request<any>(`/leaderboard/user-rank?filter=${filter}`),

  getStats: () =>
    request<any>('/leaderboard/stats'),

  daily: () =>
    request<any>('/leaderboard/daily-stats'),

  hourly: () =>
    request<any>('/leaderboard/hourly-stats'),

  platform: () =>
    request<any>('/leaderboard/stats'),
};

// ─── Portfolio ────────────────────────────────────────
export const portfolioApi = {
  getOverview: () =>
    request<any>('/portfolio/overview'),

  getRealizedPnL: (days = 30) =>
    request<any>(`/portfolio/realized-pnl?days=${days}`),

  getUnrealizedPnL: () =>
    request<any>('/portfolio/unrealized-pnl'),

  getHistory: (days = 30) =>
    request<any>(`/portfolio/history?days=${days}`),

  getMetrics: (days = 30) =>
    request<any>(`/portfolio/metrics?days=${days}`),

  getInvestedAmount: () =>
    request<any>('/portfolio/invested-amount'),
};

// ─── Market Data ──────────────────────────────────────
export const marketApi = {
  getQuotes: (symbols: string[]) =>
    request<any>(`/market/quotes?symbols=${symbols.join(',')}`),

  getHistory: (symbol: string, range = '1M') =>
    request<any>(`/market/history?symbol=${encodeURIComponent(symbol)}&range=${range}`),

  getIntraday: (symbol: string, interval = '1minute') =>
    request<any>(`/market/intraday?symbol=${encodeURIComponent(symbol)}&interval=${interval}`),

  search: (q: string) =>
    request<any>(`/market/search?q=${encodeURIComponent(q)}`),

  getOptions: (symbol: string, expiry = 'weekly') =>
    request<any>(`/market/options?symbol=${encodeURIComponent(symbol)}&expiry=${expiry}`),

  getExpiries: (symbol: string) =>
    request<any>(`/market/expiries?symbol=${encodeURIComponent(symbol)}`),
};

// ─── AI Doing Info (Trade Analytics) ─────────────────
export const aiDoingInfoApi = {
  // Get all AI trade info records
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    instrument?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.instrument) q.set('instrument', params.instrument);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return request<any>(`/ai-doing-info?${q.toString()}`);
  },

  // Get aggregated trader statistics
  getStats: () =>
    request<any>('/ai-doing-info/stats'),

  // Export trade data in AI-friendly JSON format
  export: () =>
    request<any>('/ai-doing-info/export'),
};

// ─── AI Coach ─────────────────────────────────────────
export const aiApi = {
  // Generate daily summary
  generateDailySummary: () =>
    request<any>('/ai/daily-summary', { method: 'POST' }),

  // Generate weekly summary
  generateWeeklySummary: () =>
    request<any>('/ai/weekly-summary', { method: 'POST' }),

  // Generate monthly summary
  generateMonthlySummary: () =>
    request<any>('/ai/monthly-summary', { method: 'POST' }),

  // Send chat message
  chat: (message: string, sessionId?: string) =>
    request<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  // Get chat history
  getChatHistory: (sessionId?: string) => {
    const q = sessionId ? `?sessionId=${sessionId}` : '';
    return request<any>(`/ai/chat-history${q}`);
  },

  // Clear chat history
  clearChatHistory: () =>
    request<any>('/ai/chat-history', { method: 'DELETE' }),
};

// ─── P&L Aggregator ───────────────────────────────────
export const pnlApi = {
  today: () =>
    request<any>('/pnl/today'),

  history: (days = 30) =>
    request<any>(`/pnl/history?days=${days}`),

  summary: () =>
    request<any>('/pnl/summary'),

  validate: () =>
    request<any>('/pnl/validate'),
};

// ─── AI Summaries ──────────────────────────────────────
export const aiSummaryApi = {
  get: (type: 'daily' | 'weekly' | 'monthly') =>
    request<any>(`/ai/summaries?type=${type}`),

  dashboard: (timeframe: 'daily' | 'weekly' | 'monthly') =>
    request<any>(`/ai/dashboard-summary?timeframe=${timeframe}`),
};


