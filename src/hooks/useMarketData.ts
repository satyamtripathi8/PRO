import { useEffect, useRef, useState, useCallback } from 'react';
import { marketApi } from '../lib/api';
import { WS_BASE_URL } from '../lib/config';

export interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentage: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
  pe?: number;
  marketCap?: number;
}

// ─── Config ──────────────────────────────────────────────────────────────────
const WS_URL = WS_BASE_URL;
const POLL_INTERVAL = 5_000;       // Fallback polling: 5s (only when WS is down)
const RECONNECT_DELAY = 2_000;     // Reconnect after 2s on WS drop
const MAX_RECONNECT = 10;          // Max auto-reconnect attempts
const BATCH_SIZE = 25;

export function useMarketData(symbols: string[]): {
  quotes: Record<string, QuoteData>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
  isWebSocket: boolean;
} {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isWebSocket, setIsWebSocket] = useState(false);

  const symbolsKey = symbols.filter(Boolean).join(',');
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);
  const mountedRef = useRef(true);

  // ─── HTTP Polling Fallback ─────────────────────────────────────────────────
  const fetchQuotesHTTP = useCallback(async (syms: string[]) => {
    if (!syms.length || !mountedRef.current) return;
    try {
      const batches: string[][] = [];
      for (let i = 0; i < syms.length; i += BATCH_SIZE) {
        batches.push(syms.slice(i, i + BATCH_SIZE));
      }
      const results = await Promise.all(
        batches.map(batch => marketApi.getQuotes(batch).catch(() => ({ data: [] })))
      );
      if (!mountedRef.current) return;

      const map: Record<string, QuoteData> = {};
      results.forEach(res => {
        (res.data as QuoteData[])?.forEach(q => {
          if (q?.symbol) map[q.symbol] = q;
        });
      });

      setQuotes(prev => ({ ...prev, ...map }));
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (mountedRef.current) setError(err.message ?? 'Failed to fetch quotes');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ─── Start/Stop Polling ────────────────────────────────────────────────────
  const startPolling = useCallback((syms: string[]) => {
    stopPolling();
    fetchQuotesHTTP(syms);
    pollRef.current = setInterval(() => fetchQuotesHTTP(syms), POLL_INTERVAL);
  }, [fetchQuotesHTTP]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── WebSocket Connection ──────────────────────────────────────────────────
  const connectWS = useCallback((syms: string[]) => {
    if (!syms.length) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setIsWebSocket(true);
        stopPolling(); // Stop polling once WS is live
        console.log('[WS] ✅ Connection established');

        // Subscribe to symbols
        ws.send(JSON.stringify({ type: 'subscribe', symbols: syms }));
        console.log(`[WS] 📡 Subscribed to: ${syms.join(', ')}`);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'quote' && msg.data) {
            const q = msg.data;
            // TASK 21: Log tick displayed in UI
            if (q.price > 0) {
              console.debug(`[WS] 📊 Tick displayed: ${msg.symbol || q.symbol} = ₹${q.price} (${q.change >= 0 ? '+' : ''}${q.change})`);
            }
            setQuotes(prev => ({
              ...prev,
              [msg.symbol || q.symbol]: q,
            }));
            setLastUpdated(new Date());
            setLoading(false);
            setError(null);
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = (ev) => {
        setIsWebSocket(false);
        wsRef.current = null;
        console.warn(`[WS] ⚡ Disconnected (code ${ev.code}). Reconnect attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT}`);

        if (mountedRef.current && reconnectAttempts.current < MAX_RECONNECT) {
          reconnectAttempts.current++;
          // Fall back to polling while reconnecting
          startPolling(syms);
          setTimeout(() => {
            if (mountedRef.current) connectWS(syms);
          }, RECONNECT_DELAY);
        } else if (mountedRef.current) {
          // Permanent fallback to polling
          startPolling(syms);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] ❌ WebSocket error:', err);
        // onclose will fire after onerror, so reconnection is handled there
      };

    } catch {
      // WS not available, use polling
      setIsWebSocket(false);
      startPolling(syms);
    }
  }, [stopPolling, startPolling]);

  // ─── Refetch (manual) ──────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    const syms = symbolsKey.split(',').filter(Boolean);
    fetchQuotesHTTP(syms);
  }, [symbolsKey, fetchQuotesHTTP]);

  // ─── Main Effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    reconnectAttempts.current = 0;

    if (!symbolsKey) return;
    const syms = symbolsKey.split(',').filter(Boolean);

    setLoading(true);
    // Initial HTTP fetch for immediate data, then try WS
    fetchQuotesHTTP(syms).then(() => {
      if (mountedRef.current) connectWS(syms);
    });

    return () => {
      mountedRef.current = false;
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, loading, error, lastUpdated, refetch, isWebSocket };
}
