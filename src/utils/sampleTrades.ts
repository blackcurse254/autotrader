import { TradeRecord } from '../types/trading';

/**
 * Generates realistic completed algorithmic trade sessions for initial state
 * or user simulation testing.
 */
export function generateSampleTradeHistory(
  symbol: string = 'BTC/USDT',
  basePrice: number = 67450,
  count: number = 24
): TradeRecord[] {
  const records: TradeRecord[] = [];
  const now = Date.now();
  const stepMs = 25 * 60 * 1000; // ~25 min intervals between trade sessions

  // Preset realistic win/loss distribution (~65% win rate, typical for moving average + RSI)
  const outcomes: Array<{ isWin: boolean; pnlPct: number; reason: TradeRecord['exitReason'] }> = [
    { isWin: true, pnlPct: 2.4, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.8, reason: 'SIGNAL' },
    { isWin: false, pnlPct: -1.6, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 3.1, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.2, reason: 'TRAILING_STOP' },
    { isWin: false, pnlPct: -1.9, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 2.8, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.5, reason: 'SIGNAL' },
    { isWin: false, pnlPct: -1.4, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 3.6, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.9, reason: 'TRAILING_STOP' },
    { isWin: true, pnlPct: 2.1, reason: 'TAKE_PROFIT' },
    { isWin: false, pnlPct: -1.8, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 1.4, reason: 'SIGNAL' },
    { isWin: true, pnlPct: 2.9, reason: 'TAKE_PROFIT' },
    { isWin: false, pnlPct: -1.5, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 2.2, reason: 'TRAILING_STOP' },
    { isWin: true, pnlPct: 1.7, reason: 'SIGNAL' },
    { isWin: true, pnlPct: 3.4, reason: 'TAKE_PROFIT' },
    { isWin: false, pnlPct: -1.9, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 2.5, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.6, reason: 'TRAILING_STOP' },
    { isWin: false, pnlPct: -1.7, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 2.7, reason: 'TAKE_PROFIT' },
    { isWin: true, pnlPct: 1.9, reason: 'SIGNAL' },
    { isWin: true, pnlPct: 3.0, reason: 'TAKE_PROFIT' },
    { isWin: false, pnlPct: -1.3, reason: 'STOP_LOSS' },
    { isWin: true, pnlPct: 2.3, reason: 'TRAILING_STOP' },
    { isWin: true, pnlPct: 1.8, reason: 'SIGNAL' },
    { isWin: true, pnlPct: 3.2, reason: 'TAKE_PROFIT' },
  ];

  const targetCount = Math.min(count, outcomes.length);
  const tradeSizeUSD = 2500; // 25% allocation of 10,000 balance

  for (let i = 0; i < targetCount; i++) {
    const outcome = outcomes[i];
    const sessionTime = now - (targetCount - i) * stepMs;
    const entryTime = sessionTime - 12 * 60 * 1000;
    const exitTime = sessionTime;

    const priceNoise = 1 + (Math.sin(i * 0.8) * 0.015);
    const entryPrice = Number((basePrice * priceNoise).toFixed(2));
    const priceChangeRatio = 1 + (outcome.pnlPct / 100);
    const exitPrice = Number((entryPrice * priceChangeRatio).toFixed(2));
    const amount = Number((tradeSizeUSD / entryPrice).toFixed(4));
    const feeUSD = Number((tradeSizeUSD * 0.0007).toFixed(2));
    const grossPnlUSD = (tradeSizeUSD * outcome.pnlPct) / 100;
    const realizedPnlUSD = Number((grossPnlUSD - feeUSD).toFixed(2));
    const realizedPnlPercent = Number(((realizedPnlUSD / tradeSizeUSD) * 100).toFixed(2));

    records.push({
      id: `session-trade-${1000 + i}`,
      symbol,
      side: 'LONG',
      entryPrice,
      exitPrice,
      amount,
      entryTime,
      exitTime,
      realizedPnlUSD,
      realizedPnlPercent,
      feeUSD,
      exitReason: outcome.reason,
    });
  }

  return records;
}
