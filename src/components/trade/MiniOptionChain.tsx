import { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { marketApi, ordersApi } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionData {
  ltp: number; iv: number; oi: number; vol: number; change: number;
  bidPrice?: number; askPrice?: number;
}

interface Strike {
  strike: number; isATM: boolean;
  ce: OptionData; pe: OptionData;
}

interface ChainData {
  spotPrice: number; expiry: string; strikes: Strike[];
}

interface TradePayload {
  type: 'CE' | 'PE'; strike: number; ltp: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n > 0 ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
}

const LOT_SIZES: Record<string, number> = {
  BANKNIFTY: 15, SENSEX: 10, BANKEX: 15, FINNIFTY: 40, MIDCPNIFTY: 75,
};
const DEFAULT_LOT = 50;

function getLotSize(symbol: string) {
  return LOT_SIZES[symbol.toUpperCase()] ?? DEFAULT_LOT;
}

// ─── Trade Modal ──────────────────────────────────────────────────────────────

function TradeModal({
  symbol, payload, spotPrice, onClose, onSuccess,
}: {
  symbol: string; payload: TradePayload; spotPrice: number;
  onClose: () => void; onSuccess: () => void;
}) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [lots, setLots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const lotSize  = getLotSize(symbol);
  const totalQty = lots * lotSize;
  const total    = totalQty * payload.ltp;

  const place = async () => {
    setLoading(true); setMsg('');
    try {
      const optSym = `${symbol}${payload.strike}${payload.type}`;
      await ordersApi.place({ symbol: optSym, side, orderType: 'MARKET', quantity: totalQty, entryPrice: payload.ltp });
      setMsg(`✓ ${side} ${optSym} placed`);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e: any) {
      setMsg(e.message ?? 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const isCall = payload.type === 'CE';

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-96 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between ${isCall ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div>
            <p className="text-white font-bold text-lg">{symbol} {payload.strike} {payload.type}</p>
            <p className="text-white/80 text-xs">Spot ₹{fmt(spotPrice)} · LTP ₹{fmt(payload.ltp)}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-5">
          {/* Buy / Sell toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            {(['BUY', 'SELL'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  side === s ? (s === 'BUY' ? 'bg-emerald-500 text-white shadow' : 'bg-red-500 text-white shadow') : 'text-gray-500'
                }`}>{s}</button>
            ))}
          </div>

          {/* Lots */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setLots(l => Math.max(1, l - 1))}
              className="w-10 h-10 border-2 rounded-xl font-bold text-xl flex items-center justify-center hover:bg-gray-50">−</button>
            <input type="number" min={1} value={lots} onChange={e => setLots(Math.max(1, +e.target.value))}
              className="flex-1 text-center text-xl font-bold py-2 border-2 rounded-xl outline-none focus:border-blue-500" />
            <button onClick={() => setLots(l => l + 1)}
              className="w-10 h-10 border-2 rounded-xl font-bold text-xl flex items-center justify-center hover:bg-gray-50">+</button>
          </div>

          <p className="text-xs text-gray-400 text-center mb-4">
            {lots} lot{lots > 1 ? 's' : ''} × {lotSize} qty = {totalQty} shares
          </p>

          {/* Summary */}
          <div className={`rounded-xl p-3 mb-4 text-sm ${side === 'BUY' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">LTP</span><span className="font-semibold">₹{fmt(payload.ltp)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Quantity</span><span className="font-semibold">{totalQty}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-1">
              <span className="font-bold">Total</span>
              <span className="font-bold text-base">₹{fmt(total)}</span>
            </div>
          </div>

          {msg && <p className={`text-xs mb-3 text-center ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>}

          <button onClick={place} disabled={loading}
            className={`w-full py-3 font-bold rounded-xl text-white transition-colors disabled:opacity-50 ${
              side === 'BUY' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
            }`}>
            {loading ? 'Placing…' : `${side} ${symbol}${payload.strike}${payload.type}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Option Chain Panel ──────────────────────────────────────────────────

export default function MiniOptionChain({
  symbol, initialSpot, onClose,
}: {
  symbol: string; initialSpot: number; onClose: () => void;
}) {
  const [chain, setChain]       = useState<ChainData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expiry, setExpiry]     = useState<'weekly' | 'monthly'>('weekly');
  const [trade, setTrade]       = useState<TradePayload | null>(null);
  const [spotPrice, setSpotPrice] = useState(initialSpot);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    marketApi.getOptions(symbol, expiry)
      .then(res => {
        const data = res.data ?? res;
        setChain(data);
        if (data.spotPrice > 0) setSpotPrice(data.spotPrice);
      })
      .catch(e => setError(e?.message ?? 'Failed to load option chain'))
      .finally(() => setLoading(false));
  }, [symbol, expiry]);

  useEffect(() => { load(); }, [load]);

  // Show only 10 strikes around ATM
  const strikes = (chain?.strikes ?? []).slice(0, 20);
  const atmIndex = strikes.findIndex(s => s.isATM);

  return (
    <div className="flex flex-col bg-white border-t border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-800 text-sm">⚡ {symbol} Option Chain</span>
          {spotPrice > 0 && <span className="text-xs text-gray-500">Spot: ₹{fmt(spotPrice)}</span>}
          {chain?.expiry && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{chain.expiry}</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Expiry toggle */}
          <div className="flex bg-gray-200 rounded-lg p-0.5">
            {(['weekly', 'monthly'] as const).map(e => (
              <button key={e} onClick={() => setExpiry(e)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  expiry === e ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{e}</button>
            ))}
          </div>
          <button onClick={load} title="Refresh" className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors text-gray-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading…
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={load} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">Retry</button>
          </div>
        )}
        {!loading && !error && strikes.length > 0 && (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b">
                {/* CALL header */}
                <th colSpan={4} className="py-1.5 text-center text-emerald-700 font-semibold bg-emerald-50 border-r border-gray-200">CALLS</th>
                <th className="py-1.5 px-3 text-center font-bold text-gray-700 w-24">STRIKE</th>
                {/* PUT header */}
                <th colSpan={4} className="py-1.5 text-center text-red-700 font-semibold bg-red-50 border-l border-gray-200">PUTS</th>
              </tr>
              <tr className="bg-gray-50 border-b text-gray-500">
                <th className="py-1 px-2 text-right font-medium">OI</th>
                <th className="py-1 px-2 text-right font-medium">IV</th>
                <th className="py-1 px-2 text-right font-medium">LTP</th>
                <th className="py-1 px-2 text-center font-medium w-10">Buy</th>
                <th className="py-1 px-3 text-center font-bold text-gray-700 bg-white">Strike</th>
                <th className="py-1 px-2 text-center font-medium w-10">Buy</th>
                <th className="py-1 px-2 text-right font-medium">LTP</th>
                <th className="py-1 px-2 text-right font-medium">IV</th>
                <th className="py-1 px-2 text-right font-medium">OI</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((s, i) => {
                const isATM = i === atmIndex || s.isATM;
                const rowBg = isATM ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
                const ceChange = s.ce.change;
                const peChange = s.pe.change;
                return (
                  <tr key={s.strike} className={`${rowBg} border-b border-gray-100 hover:bg-blue-50/30 transition-colors`}>
                    {/* CALL side */}
                    <td className="py-1.5 px-2 text-right text-gray-600">{s.ce.oi > 0 ? (s.ce.oi / 1000).toFixed(0) + 'K' : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-gray-600">{s.ce.iv > 0 ? s.ce.iv.toFixed(1) + '%' : '—'}</td>
                    <td className={`py-1.5 px-2 text-right font-semibold ${ceChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(s.ce.ltp)}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <button
                        onClick={() => setTrade({ type: 'CE', strike: s.strike, ltp: s.ce.ltp })}
                        disabled={s.ce.ltp <= 0}
                        className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold hover:bg-emerald-200 disabled:opacity-30 transition-colors"
                      >B/S</button>
                    </td>

                    {/* Strike */}
                    <td className={`py-1.5 px-3 text-center font-bold text-sm border-x border-gray-200 ${isATM ? 'text-yellow-700 bg-yellow-100' : 'text-gray-800 bg-white'}`}>
                      {s.strike.toLocaleString('en-IN')}
                      {isATM && <span className="ml-1 text-[9px] bg-yellow-400 text-yellow-900 px-1 rounded font-black">ATM</span>}
                    </td>

                    {/* PUT side */}
                    <td className="py-1.5 px-1 text-center">
                      <button
                        onClick={() => setTrade({ type: 'PE', strike: s.strike, ltp: s.pe.ltp })}
                        disabled={s.pe.ltp <= 0}
                        className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-semibold hover:bg-red-200 disabled:opacity-30 transition-colors"
                      >B/S</button>
                    </td>
                    <td className={`py-1.5 px-2 text-right font-semibold ${peChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(s.pe.ltp)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-600">{s.pe.iv > 0 ? s.pe.iv.toFixed(1) + '%' : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-gray-600">{s.pe.oi > 0 ? (s.pe.oi / 1000).toFixed(0) + 'K' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && !error && strikes.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No option data available</div>
        )}
      </div>

      {/* Trade Modal */}
      {trade && (
        <TradeModal
          symbol={symbol}
          payload={trade}
          spotPrice={spotPrice}
          onClose={() => setTrade(null)}
          onSuccess={() => setTrade(null)}
        />
      )}
    </div>
  );
}
