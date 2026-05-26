import type { Time } from 'lightweight-charts';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface LinePoint {
  time: Time;
  value: number;
}

export interface HistogramPoint {
  time: Time;
  value: number;
  color?: string;
}

// ─── Simple Moving Average ────────────────────────────────────────────────────
export function calcSMA(candles: CandleData[], period: number): LinePoint[] {
  const result: LinePoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push({ time: candles[i].time as Time, value: sum / period });
  }
  return result;
}

// ─── Exponential Moving Average ───────────────────────────────────────────────
export function calcEMA(candles: CandleData[], period: number): LinePoint[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const result: LinePoint[] = [];
  let ema = 0;
  for (let i = 0; i < period; i++) ema += candles[i].close;
  ema /= period;
  result.push({ time: candles[period - 1].time as Time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time as Time, value: ema });
  }
  return result;
}

// ─── VWAP (Volume Weighted Average Price) ─────────────────────────────────────
export function calcVWAP(candles: CandleData[]): LinePoint[] {
  let cumTPV = 0;
  let cumVol = 0;
  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3;
    const vol = c.volume ?? 0;
    cumTPV += tp * vol;
    cumVol += vol;
    return { time: c.time as Time, value: cumVol > 0 ? cumTPV / cumVol : tp };
  });
}

// ─── Relative Strength Index ─────────────────────────────────────────────────
export function calcRSI(candles: CandleData[], period = 14): LinePoint[] {
  if (candles.length < period + 1) return [];
  const result: LinePoint[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  const r0 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({ time: candles[period].time as Time, value: r0 });
  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: candles[i].time as Time, value: rsi });
  }
  return result;
}

// ─── MACD ────────────────────────────────────────────────────────────────────
export function calcMACD(
  candles: CandleData[],
  fast = 12, slow = 26, signal = 9
): { macd: LinePoint[]; signal: LinePoint[]; histogram: HistogramPoint[] } {
  const emaFast = calcEMA(candles, fast);
  const emaSlow = calcEMA(candles, slow);
  if (!emaFast.length || !emaSlow.length) return { macd: [], signal: [], histogram: [] };

  const fastMap = new Map(emaFast.map(p => [String(p.time), p.value]));
  const macdLine: LinePoint[] = emaSlow
    .filter(p => fastMap.has(String(p.time)))
    .map(p => ({ time: p.time, value: (fastMap.get(String(p.time)) ?? 0) - p.value }));

  if (macdLine.length < signal) return { macd: macdLine, signal: [], histogram: [] };

  const k = 2 / (signal + 1);
  let ema = macdLine.slice(0, signal).reduce((a, p) => a + p.value, 0) / signal;
  const signalLine: LinePoint[] = [{ time: macdLine[signal - 1].time, value: ema }];
  for (let i = signal; i < macdLine.length; i++) {
    ema = macdLine[i].value * k + ema * (1 - k);
    signalLine.push({ time: macdLine[i].time, value: ema });
  }

  const sigMap = new Map(signalLine.map(p => [String(p.time), p.value]));
  const histogram: HistogramPoint[] = macdLine
    .filter(p => sigMap.has(String(p.time)))
    .map(p => {
      const h = p.value - (sigMap.get(String(p.time)) ?? 0);
      return { time: p.time, value: h, color: h >= 0 ? '#26a69a' : '#ef5350' };
    });

  return { macd: macdLine, signal: signalLine, histogram };
}
