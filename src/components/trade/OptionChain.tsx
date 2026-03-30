import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import { marketApi, ordersApi } from '../../lib/api';

interface OptionData {
  ltp: number;
  iv: number;
  oi: number;
  vol: number;
  change: number;
  oiChange?: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
}

interface OptionRow {
  strike: number;
  isATM: boolean;
  ce: OptionData;
  pe: OptionData;
}

interface OptionChainData {
  spotPrice: number;
  expiryDays: number;
  expiry: string;
  expiryDate?: string;
  strikes: OptionRow[];
  source?: string;
}

interface Props {
  symbol: string;
  spotPrice: number;
  onOptionClick?: (type: 'CE' | 'PE', strike: number, ltp: number) => void;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 100_000) return (n / 100_000).toFixed(1) + 'L';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toString();
}

export default function OptionChain({ symbol, spotPrice, onOptionClick }: Props) {
  const [chain, setChain] = useState<OptionChainData | null>(null);
  const [expiry, setExpiry] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(false);
  const [orderMsg, setOrderMsg] = useState('');
  const [showGreeks, setShowGreeks] = useState(false);
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ type: 'CE' | 'PE'; strike: number; ltp: number } | null>(null);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState(1);

  const fetchChain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketApi.getOptions(symbol, expiry);
      setChain(res.data);
    } catch {
      setChain(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, expiry]);

  useEffect(() => {
    fetchChain();
    // Auto-refresh every 5 seconds for real-time data
    const interval = setInterval(fetchChain, 10000);
    return () => clearInterval(interval);
  }, [fetchChain]);

  const placeOptionOrder = async (forceSide?: 'BUY' | 'SELL', forceType?: 'CE' | 'PE', forceStrike?: number, forceLtp?: number) => {
    const tradeSide = forceSide ?? side;
    const trade = {
      type: forceType ?? selected?.type,
      strike: forceStrike ?? selected?.strike,
      ltp: forceLtp ?? selected?.ltp,
    };

    if (!trade.type || !trade.strike || !trade.ltp) return;

    try {
      const cleanSymbol = `${symbol.replace('NSE:', '')}${trade.strike}${trade.type}`;
      await ordersApi.place({ symbol: cleanSymbol, side: tradeSide, orderType: 'MARKET', quantity: qty, entryPrice: trade.ltp });
      setOrderMsg(`${tradeSide} ${cleanSymbol} • Qty ${qty} @ ₹${trade.ltp.toFixed(2)}`);
      setSelected(null);
      setTimeout(() => setOrderMsg(''), 3000);
    } catch (e: any) {
      setOrderMsg(e.message || 'Order failed');
      setTimeout(() => setOrderMsg(''), 3000);
    }
  };

  const handleOptionClick = (type: 'CE' | 'PE', strike: number, ltp: number) => {
    if (onOptionClick) {
      onOptionClick(type, strike, ltp);
      return;
    }
    setSelected({ type, strike, ltp });
    setSide('BUY');
    setQty(1);
  };

  // Calculate max OI for visualization
  const maxOI = chain?.strikes.reduce((max, s) => Math.max(max, s.ce.oi, s.pe.oi), 0) || 1;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Option Chain</span>
          <span className="text-sm text-gray-500">
            Spot: <span className="font-semibold text-blue-600">₹{(chain?.spotPrice || spotPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </span>
          {chain?.expiryDate && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
              Exp: {chain.expiryDate}
            </span>
          )}
          {chain?.source === 'upstox' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live (Upstox)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Greeks Toggle */}
          <button
            onClick={() => setShowGreeks(!showGreeks)}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
              showGreeks ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Greeks
          </button>
          {/* Expiry Selector */}
          <div className="relative">
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as 'weekly' | 'monthly')}
              className="appearance-none bg-gray-100 text-xs font-medium px-3 py-1.5 pr-7 rounded-lg cursor-pointer hover:bg-gray-200 outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          {/* Refresh */}
          <button
            onClick={fetchChain}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {orderMsg && (
        <div className={`px-4 py-2 text-xs border-b ${orderMsg.includes('BUY') || orderMsg.includes('SELL') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {orderMsg}
        </div>
      )}

      {loading && !chain ? (
        <div className="p-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin" />
          Loading option chain...
        </div>
      ) : !chain ? (
        <div className="p-6 text-center text-sm text-gray-400">Option chain unavailable</div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-green-50 via-gray-50 to-red-50">
                {/* CE Columns */}
                <th className="py-2 px-2 text-left text-green-700 font-semibold bg-green-50/80">OI</th>
                <th className="py-2 px-2 text-right text-green-700 font-semibold bg-green-50/80">Chg</th>
                <th className="py-2 px-2 text-right text-green-700 font-semibold bg-green-50/80">Vol</th>
                <th className="py-2 px-2 text-right text-green-700 font-semibold bg-green-50/80">IV</th>
                {showGreeks && (
                  <>
                    <th className="py-2 px-1 text-right text-green-600 font-medium bg-green-50/80">Delta</th>
                    <th className="py-2 px-1 text-right text-green-600 font-medium bg-green-50/80">Theta</th>
                  </>
                )}
                <th className="py-2 px-3 text-right text-green-800 font-bold bg-green-100">CE LTP</th>

                {/* Strike */}
                <th className="py-2 px-4 text-center font-bold text-gray-800 bg-gray-100 border-x">STRIKE</th>

                {/* PE Columns */}
                <th className="py-2 px-3 text-left text-red-800 font-bold bg-red-100">PE LTP</th>
                {showGreeks && (
                  <>
                    <th className="py-2 px-1 text-left text-red-600 font-medium bg-red-50/80">Delta</th>
                    <th className="py-2 px-1 text-left text-red-600 font-medium bg-red-50/80">Theta</th>
                  </>
                )}
                <th className="py-2 px-2 text-left text-red-700 font-semibold bg-red-50/80">IV</th>
                <th className="py-2 px-2 text-left text-red-700 font-semibold bg-red-50/80">Vol</th>
                <th className="py-2 px-2 text-left text-red-700 font-semibold bg-red-50/80">Chg</th>
                <th className="py-2 px-2 text-right text-red-700 font-semibold bg-red-50/80">OI</th>
              </tr>
            </thead>
            <tbody>
              {chain.strikes.map(row => {
                const isITMCall = row.strike < (chain.spotPrice || spotPrice);
                const isITMPut = row.strike > (chain.spotPrice || spotPrice);
                const isHovered = hoveredStrike === row.strike;

                return (
                  <tr
                    key={row.strike}
                    className={`border-b transition-colors ${
                      row.isATM ? 'bg-yellow-50/50 font-semibold' : 'hover:bg-blue-50/30'
                    } ${isHovered ? 'bg-blue-50' : ''}`}
                    onMouseEnter={() => setHoveredStrike(row.strike)}
                    onMouseLeave={() => setHoveredStrike(null)}
                  >
                    {/* CE OI with bar */}
                    <td className={`py-1.5 px-2 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                      <div className="flex items-center gap-1">
                        <div
                          className="h-3 bg-green-200 rounded-sm"
                          style={{ width: `${Math.min((row.ce.oi / maxOI) * 40, 40)}px` }}
                        />
                        <span className="text-gray-600">{fmt(row.ce.oi)}</span>
                      </div>
                    </td>
                    <td className={`py-1.5 px-2 text-right ${isITMCall ? 'bg-green-50/50' : ''}`}>
                      <span className={row.ce.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {row.ce.change >= 0 ? '+' : ''}{row.ce.change.toFixed(1)}
                      </span>
                    </td>
                    <td className={`py-1.5 px-2 text-right text-gray-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                      {fmt(row.ce.vol)}
                    </td>
                    <td className={`py-1.5 px-2 text-right text-purple-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                      {row.ce.iv}%
                    </td>
                    {showGreeks && (
                      <>
                        <td className={`py-1.5 px-1 text-right text-gray-500 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                          {row.ce.delta?.toFixed(2) || '-'}
                        </td>
                        <td className={`py-1.5 px-1 text-right text-gray-500 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                          {row.ce.theta?.toFixed(2) || '-'}
                        </td>
                      </>
                    )}
                    {/* CE LTP - Clickable */}
                    <td
                      className={`py-1.5 px-3 text-right cursor-pointer hover:bg-green-200 transition-colors ${
                        isITMCall ? 'bg-green-100' : 'bg-green-50'
                      }`}
                      onClick={() => handleOptionClick('CE', row.strike, row.ce.ltp)}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {row.ce.change >= 0 ? (
                          <TrendingUp size={10} className="text-green-600" />
                        ) : (
                          <TrendingDown size={10} className="text-red-500" />
                        )}
                        <span className="font-semibold text-green-800">{row.ce.ltp.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* Strike Price */}
                    <td className={`py-1.5 px-4 text-center font-bold border-x ${
                      row.isATM ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-50'
                    }`}>
                      {row.strike.toLocaleString()}
                      {row.isATM && <span className="ml-1 text-[9px]">ATM</span>}
                    </td>

                    {/* PE LTP - Clickable */}
                    <td
                      className={`py-1.5 px-3 text-left cursor-pointer hover:bg-red-200 transition-colors ${
                        isITMPut ? 'bg-red-100' : 'bg-red-50'
                      }`}
                      onClick={() => handleOptionClick('PE', row.strike, row.pe.ltp)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-red-800">{row.pe.ltp.toFixed(2)}</span>
                        {row.pe.change >= 0 ? (
                          <TrendingUp size={10} className="text-green-600" />
                        ) : (
                          <TrendingDown size={10} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    {showGreeks && (
                      <>
                        <td className={`py-1.5 px-1 text-left text-gray-500 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                          {row.pe.delta?.toFixed(2) || '-'}
                        </td>
                        <td className={`py-1.5 px-1 text-left text-gray-500 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                          {row.pe.theta?.toFixed(2) || '-'}
                        </td>
                      </>
                    )}
                    <td className={`py-1.5 px-2 text-left text-purple-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                      {row.pe.iv}%
                    </td>
                    <td className={`py-1.5 px-2 text-left text-gray-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                      {fmt(row.pe.vol)}
                    </td>
                    <td className={`py-1.5 px-2 text-left ${isITMPut ? 'bg-red-50/50' : ''}`}>
                      <span className={row.pe.change >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {row.pe.change >= 0 ? '+' : ''}{row.pe.change.toFixed(1)}
                      </span>
                    </td>
                    {/* PE OI with bar */}
                    <td className={`py-1.5 px-2 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-600">{fmt(row.pe.oi)}</span>
                        <div
                          className="h-3 bg-red-200 rounded-sm"
                          style={{ width: `${Math.min((row.pe.oi / maxOI) * 40, 40)}px` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-yellow-200 rounded" /> ATM
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-green-100 rounded" /> ITM Call
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-100 rounded" /> ITM Put
          </span>
        </div>
        <span>Click LTP to trade</span>
      </div>

      {selected && (
        <div className="fixed inset-x-4 bottom-4 z-40 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] drop-shadow-2xl">
          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${
              selected.type === 'CE' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div>
                <p className="text-xs text-gray-500">{symbol.replace('NSE:', '')} • {selected.type}</p>
                <p className="text-lg font-bold text-gray-900">Strike {selected.strike} @ ₹{selected.ltp.toFixed(2)}</p>
                <p className="text-[11px] text-gray-500">Spot ₹{(chain?.spotPrice || spotPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                {(['BUY', 'SELL'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2 rounded-xl font-semibold border transition-colors ${
                      side === s
                        ? s === 'BUY'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-red-500 text-white border-red-500'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Qty</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 border rounded-lg text-xl">−</button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, +e.target.value))}
                    className="w-16 text-center border rounded-lg py-2"
                  />
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-10 border rounded-lg text-xl">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Est. Value</span>
                <span className="font-semibold text-gray-900">₹{(qty * selected.ltp).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => placeOptionOrder('BUY', selected.type, selected.strike, selected.ltp)}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                >
                  Buy @ ₹{selected.ltp.toFixed(2)}
                </button>
                <button
                  onClick={() => placeOptionOrder('SELL', selected.type, selected.strike, selected.ltp)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Sell @ ₹{selected.ltp.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
