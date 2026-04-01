import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, RefreshCw, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { marketApi } from '../../lib/api';

interface Strike {
  strike: number;
  isATM: boolean;
  ce: { ltp: number; change: number; oi: number; vol: number };
  pe: { ltp: number; change: number; oi: number; vol: number };
}

interface OptionChainData {
  spotPrice: number;
  expiry: string;
  expiryDate?: string;
  strikes: Strike[];
}

function fmtCompact(n: number) {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n?.toString() ?? '0';
}

interface OptionChainPanelProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  spotPrice?: number;
}

export default function OptionChainPanel({
  isOpen,
  onClose,
  symbol,
  spotPrice,
}: OptionChainPanelProps) {
  const navigate = useNavigate();
  const [chain, setChain] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketApi.getOptions(symbol, 'weekly');
      setChain(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load option chain');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchChain();
    }
  }, [isOpen, symbol, fetchChain]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const spot = chain?.spotPrice || spotPrice || 0;
  const strikes = chain?.strikes || [];
  // Show ~10 strikes around ATM
  const atmIndex = strikes.findIndex(s => s.isATM);
  const startIdx = Math.max(0, atmIndex - 5);
  const visibleStrikes = strikes.slice(startIdx, startIdx + 11);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] md:w-[540px] bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{symbol} Options</h2>
            <div className="flex items-center gap-3 mt-0.5">
              {spot > 0 && (
                <span className="text-sm text-gray-500">
                  Spot: <span className="font-semibold text-blue-600">₹{spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </span>
              )}
              {chain?.expiryDate && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                  {chain.expiryDate}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchChain}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !chain ? (
            <div className="flex flex-col items-center justify-center h-64">
              <RefreshCw size={24} className="animate-spin text-blue-500 mb-3" />
              <p className="text-sm text-gray-500">Loading option chain...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 px-6">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <button
                onClick={fetchChain}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 px-5 py-3 bg-gray-50 border-b text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-yellow-300 rounded" /> ATM
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-green-100 rounded" /> Call ITM
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-red-100 rounded" /> Put ITM
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b">
                      <th colSpan={3} className="py-2.5 text-center text-green-700 font-bold bg-green-50 text-xs">CALLS</th>
                      <th className="py-2.5 text-center font-bold bg-gray-100 border-x text-xs">STRIKE</th>
                      <th colSpan={3} className="py-2.5 text-center text-red-700 font-bold bg-red-50 text-xs">PUTS</th>
                    </tr>
                    <tr className="text-[10px] text-gray-500 border-b">
                      <th className="py-1.5 px-2 text-right bg-green-50/50">OI</th>
                      <th className="py-1.5 px-2 text-right bg-green-50/50 font-semibold">LTP</th>
                      <th className="py-1.5 px-2 text-right bg-green-50/50">Chg</th>
                      <th className="py-1.5 px-2 text-center bg-gray-50 border-x"></th>
                      <th className="py-1.5 px-2 text-left bg-red-50/50">Chg</th>
                      <th className="py-1.5 px-2 text-left bg-red-50/50 font-semibold">LTP</th>
                      <th className="py-1.5 px-2 text-left bg-red-50/50">OI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStrikes.map(row => {
                      const isITMCall = row.strike < spot;
                      const isITMPut = row.strike > spot;
                      return (
                        <tr
                          key={row.strike}
                          className={`border-b hover:bg-blue-50/30 transition-colors ${
                            row.isATM ? 'bg-yellow-50' : ''
                          }`}
                        >
                          {/* Call OI */}
                          <td className={`py-2 px-2 text-right text-gray-600 ${isITMCall ? 'bg-green-50/50' : ''}`}>
                            {fmtCompact(row.ce.oi)}
                          </td>
                          {/* Call LTP */}
                          <td className={`py-2 px-2 text-right font-semibold ${isITMCall ? 'bg-green-100 text-green-800' : 'bg-green-50 text-green-700'}`}>
                            <div className="flex items-center justify-end gap-0.5">
                              {row.ce.change >= 0 ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-400" />}
                              {row.ce.ltp.toFixed(2)}
                            </div>
                          </td>
                          {/* Call Change */}
                          <td className={`py-2 px-2 text-right ${isITMCall ? 'bg-green-50/50' : ''}`}>
                            <span className={`font-medium ${row.ce.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {row.ce.change >= 0 ? '+' : ''}{row.ce.change.toFixed(1)}
                            </span>
                          </td>

                          {/* Strike */}
                          <td className={`py-2 px-2 text-center font-bold border-x text-xs ${
                            row.isATM ? 'bg-yellow-300 text-yellow-900' : 'bg-gray-50'
                          }`}>
                            {row.strike.toLocaleString()}
                            {row.isATM && <span className="block text-[9px] font-normal opacity-70">ATM</span>}
                          </td>

                          {/* Put Change */}
                          <td className={`py-2 px-2 text-left ${isITMPut ? 'bg-red-50/50' : ''}`}>
                            <span className={`font-medium ${row.pe.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {row.pe.change >= 0 ? '+' : ''}{row.pe.change.toFixed(1)}
                            </span>
                          </td>
                          {/* Put LTP */}
                          <td className={`py-2 px-2 text-left font-semibold ${isITMPut ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-700'}`}>
                            <div className="flex items-center gap-0.5">
                              {row.pe.ltp.toFixed(2)}
                              {row.pe.change >= 0 ? <TrendingUp size={10} className="text-green-500" /> : <TrendingDown size={10} className="text-red-400" />}
                            </div>
                          </td>
                          {/* Put OI */}
                          <td className={`py-2 px-2 text-left text-gray-600 ${isITMPut ? 'bg-red-50/50' : ''}`}>
                            {fmtCompact(row.pe.oi)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50">
          <button
            onClick={() => {
              onClose();
              navigate(`/Home/options/${symbol}`);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-purple-700 transition-all shadow-md active:scale-[0.98]"
          >
            <ExternalLink size={16} />
            View Full Option Chain
          </button>
        </div>
      </div>
    </>
  );
}
