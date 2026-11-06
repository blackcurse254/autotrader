import { Candle, OrderBook } from '../types/trading';

export interface MarketAsset {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number;
  decimalPlaces: number;
  minOrderSize: number;
  category: 'Crypto' | 'Stock';
}

export const SUPPORTED_ASSETS: MarketAsset[] = [
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    basePrice: 67450,
    volatility: 0.022,
    decimalPlaces: 2,
    minOrderSize: 0.001,
    category: 'Crypto',
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    basePrice: 3420,
    volatility: 0.028,
    decimalPlaces: 2,
    minOrderSize: 0.01,
    category: 'Crypto',
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    basePrice: 182.5,
    volatility: 0.038,
    decimalPlaces: 2,
    minOrderSize: 0.1,
    category: 'Crypto',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    basePrice: 139.2,
    volatility: 0.025,
    decimalPlaces: 2,
    minOrderSize: 1,
    category: 'Stock',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    basePrice: 228.4,
    volatility: 0.015,
    decimalPlaces: 2,
    minOrderSize: 1,
    category: 'Stock',
  },
];

export type MarketRegime = 'RECENT' | 'BULL_RUN' | 'BEAR_TREND' | 'VOLATILE_CHOP' | 'SIDEWAYS';

/**
 * Generates initial historical candles based on asset and selected market regime.
 */
export function generateHistoricalCandles(
  asset: MarketAsset,
  count = 150,
  regime: MarketRegime = 'RECENT',
  intervalMinutes = 60
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const startTime = now - count * intervalMs;

  let currentPrice = asset.basePrice;

  // Drift settings per regime
  let drift = 0.0001;
  let volatility = asset.volatility;

  if (regime === 'BULL_RUN') {
    drift = 0.0025; // steady uptrend
    volatility = asset.volatility * 1.1;
    currentPrice = asset.basePrice * 0.72; // starts lower
  } else if (regime === 'BEAR_TREND') {
    drift = -0.0022; // steady downtrend
    volatility = asset.volatility * 1.3;
    currentPrice = asset.basePrice * 1.35; // starts higher
  } else if (regime === 'VOLATILE_CHOP') {
    drift = 0.0;
    volatility = asset.volatility * 2.2;
  } else if (regime === 'SIDEWAYS') {
    drift = 0.0;
    volatility = asset.volatility * 0.6;
  }

  // Pre-seed pseudo random walk with sine wave cycles for realistic technical formations
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * intervalMs;
    const cycle = Math.sin(i / 12) * (volatility * 0.8);
    const shock = (Math.random() - 0.49) * volatility;
    const changePercent = drift + cycle + shock;

    const open = currentPrice;
    const close = Math.max(open * (1 + changePercent), asset.basePrice * 0.1);
    const wickHigh = Math.max(open, close) * (1 + Math.random() * (volatility * 0.6));
    const wickLow = Math.min(open, close) * (1 - Math.random() * (volatility * 0.6));
    const volume = Math.floor(1000 + Math.random() * 8000 + Math.abs(changePercent) * 80000);

    candles.push({
      timestamp,
      open: Number(open.toFixed(asset.decimalPlaces)),
      high: Number(wickHigh.toFixed(asset.decimalPlaces)),
      low: Number(wickLow.toFixed(asset.decimalPlaces)),
      close: Number(close.toFixed(asset.decimalPlaces)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Updates the latest candle or produces a new tick/candle.
 */
export function simulateTick(
  lastCandle: Candle,
  asset: MarketAsset,
  intervalMinutes = 60
): { updatedCandle: Candle; isNewCandle: boolean; lastTickPrice: number } {
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const isNewCandle = now - lastCandle.timestamp >= intervalMs;

  const tickVolatility = asset.volatility * 0.15;
  const tickDelta = (Math.random() - 0.495) * tickVolatility;
  const newPrice = Number(
    Math.max(lastCandle.close * (1 + tickDelta), asset.basePrice * 0.1).toFixed(asset.decimalPlaces)
  );

  if (isNewCandle) {
    const newCandle: Candle = {
      timestamp: lastCandle.timestamp + intervalMs,
      open: lastCandle.close,
      high: Math.max(lastCandle.close, newPrice),
      low: Math.min(lastCandle.close, newPrice),
      close: newPrice,
      volume: Math.floor(150 + Math.random() * 400),
    };
    return { updatedCandle: newCandle, isNewCandle: true, lastTickPrice: newPrice };
  } else {
    const updatedCandle: Candle = {
      ...lastCandle,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice),
      close: newPrice,
      volume: lastCandle.volume + Math.floor(10 + Math.random() * 40),
    };
    return { updatedCandle, isNewCandle: false, lastTickPrice: newPrice };
  }
}

/**
 * Generates a realistic Order Book with 8 bids and 8 asks around the current mid price.
 */
export function generateOrderBook(midPrice: number, decimalPlaces = 2): OrderBook {
  const spreadBps = 0.0003; // ~3 bps
  const halfSpread = midPrice * (spreadBps / 2);
  const bestBid = midPrice - halfSpread;
  const bestAsk = midPrice + halfSpread;

  const bids = [];
  const asks = [];

  let cumBidVol = 0;
  for (let i = 0; i < 8; i++) {
    const price = bestBid * (1 - i * 0.0006);
    const amount = Number((0.2 + Math.random() * 1.5 + i * 0.3).toFixed(3));
    cumBidVol += amount;
    bids.push({
      price: Number(price.toFixed(decimalPlaces)),
      amount,
      total: Number(cumBidVol.toFixed(3)),
    });
  }

  let cumAskVol = 0;
  for (let i = 0; i < 8; i++) {
    const price = bestAsk * (1 + i * 0.0006);
    const amount = Number((0.2 + Math.random() * 1.5 + i * 0.3).toFixed(3));
    cumAskVol += amount;
    asks.push({
      price: Number(price.toFixed(decimalPlaces)),
      amount,
      total: Number(cumAskVol.toFixed(3)),
    });
  }

  const spread = bestAsk - bestBid;
  const spreadPercent = (spread / midPrice) * 100;

  return {
    bids,
    asks,
    spread: Number(spread.toFixed(decimalPlaces)),
    spreadPercent: Number(spreadPercent.toFixed(4)),
    lastPrice: midPrice,
  };
}
