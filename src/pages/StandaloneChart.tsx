import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MultiChartLayout from '../components/trade/MultiChartLayout';

export default function StandaloneChart() {
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol]       = useState('NIFTY50');
  const [timeframe, setTimeframe] = useState('1D');
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    const sym = searchParams.get('symbol');
    const tf  = searchParams.get('timeframe');
    if (sym) setSymbol(sym.toUpperCase());
    if (tf)  setTimeframe(tf);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      <MultiChartLayout
        initialSymbol={symbol}
        initialTimeframe={timeframe}
      />
    </div>
  );
}
