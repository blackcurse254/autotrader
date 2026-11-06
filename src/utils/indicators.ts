import { Candle, StrategyConfig, TradeSignal } from '../types/trading';

/**
 * Calculates Simple Moving Average (SMA) for an array of values over a given period.
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA) for an array of values.
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[j];
      }
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      prevEma = data[i] * k + (prevEma as number) * (1 - k);
      result.push(prevEma);
    }
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI).
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  // First period calculations
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Fill initial nulls
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + firstRs);
  result.push(firstRsi);

  // Subsequent smoothed values (Wilder's Smoothing)
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

/**
 * Calculates Bollinger Bands (Upper, Middle, Lower).
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSqDiff = 0;
      for (let j = 0; j < period; j++) {
        sumSqDiff += Math.pow(closes[i - j] - mid, 2);
      }
      const variance = sumSqDiff / period;
      const stdDev = Math.sqrt(variance);

      upper.push(mid + stdDevMultiplier * stdDev);
      lower.push(mid - stdDevMultiplier * stdDev);
    }
  }

  return { upper, middle, lower };
}

/**
 * Calculates Moving Average Convergence Divergence (MACD).
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macdLine.push(f - s);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate Signal Line (EMA of MACD line)
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      validMacdValues.push(macdLine[i] as number);
      validIndices.push(i);
    }
  }

  const signalLineValid = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  const histogram: (number | null)[] = new Array(closes.length).fill(null);

  for (let j = 0; j < validIndices.length; j++) {
    const origIndex = validIndices[j];
    const sigVal = signalLineValid[j];
    signalLine[origIndex] = sigVal;
    const mVal = macdLine[origIndex];
    if (mVal !== null && sigVal !== null) {
      histogram[origIndex] = mVal - sigVal;
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Average True Range (ATR).
 */
export function calculateATR(candles: Candle[], period = 14): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const highLow = candles[i].high - candles[i].low;
      const highClose = Math.abs(candles[i].high - candles[i - 1].close);
      const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(highLow, highClose, lowClose));
    }
  }

  const result: (number | null)[] = [];
  if (tr.length < period) {
    return candles.map(() => null);
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += tr[i];
    result.push(null);
  }
  let prevATR = sum / period;
  result[period - 1] = prevATR;

  for (let i = period; i < tr.length; i++) {
    prevATR = (prevATR * (period - 1) + tr[i]) / period;
    result.push(prevATR);
  }

  return result;
}

/**
 * Evaluates the active strategy against the latest candles to produce a trade signal: BUY, SELL, or HOLD.
 */
export function evaluateStrategySignal(
  candles: Candle[],
  strategy: StrategyConfig,
  currentPositionSide: 'LONG' | 'SHORT' | null
): { signal: TradeSignal; reason: string } {
  if (candles.length < 30) {
    return { signal: 'HOLD', reason: 'Insufficient candle history for calculation' };
  }

  const closes = candles.map((c) => c.close);
  const lastIndex = closes.length - 1;
  const prevIndex = lastIndex - 1;
  const currentPrice = closes[lastIndex];

  switch (strategy.type) {
    case 'SMA_CROSS': {
      const fast = calculateSMA(closes, strategy.fastPeriod);
      const slow = calculateSMA(closes, strategy.slowPeriod);

      const currFast = fast[lastIndex];
      const currSlow = slow[lastIndex];
      const prevFast = fast[prevIndex];
      const prevSlow = slow[prevIndex];

      if (
        currFast === null ||
        currSlow === null ||
        prevFast === null ||
        prevSlow === null
      ) {
        return { signal: 'HOLD', reason: 'SMA warming up' };
      }

      // Golden Cross: Fast crosses above Slow
      if (prevFast <= prevSlow && currFast > currSlow) {
        if (currentPositionSide !== 'LONG') {
          return {
            signal: 'BUY',
            reason: `Golden Cross: Fast SMA (${strategy.fastPeriod}) crossed above Slow SMA (${strategy.slowPeriod})`,
          };
        }
      }

      // Death Cross: Fast crosses below Slow
      if (prevFast >= prevSlow && currFast < currSlow) {
        if (currentPositionSide === 'LONG') {
          return {
            signal: 'SELL',
            reason: `Death Cross: Fast SMA (${strategy.fastPeriod}) crossed below Slow SMA (${strategy.slowPeriod})`,
          };
        }
      }

      return { signal: 'HOLD', reason: 'No crossover detected' };
    }

    case 'RSI_REVERSION': {
      const rsi = calculateRSI(closes, strategy.rsiPeriod);
      const currRsi = rsi[lastIndex];
      const prevRsi = rsi[prevIndex];

      if (currRsi === null || prevRsi === null) {
        return { signal: 'HOLD', reason: 'RSI warming up' };
      }

      // Buy when RSI bounces back above oversold threshold
      if (prevRsi <= strategy.rsiOversold && currRsi > strategy.rsiOversold) {
        if (currentPositionSide !== 'LONG') {
          return {
            signal: 'BUY',
            reason: `RSI Oversold Bounce: RSI rose above ${strategy.rsiOversold} (current: ${currRsi.toFixed(1)})`,
          };
        }
      }

      // Sell when RSI crosses below overbought threshold or reaches extreme
      if (currRsi >= strategy.rsiOverbought || (prevRsi >= strategy.rsiOverbought && currRsi < strategy.rsiOverbought)) {
        if (currentPositionSide === 'LONG') {
          return {
            signal: 'SELL',
            reason: `RSI Overbought: RSI reached ${currRsi.toFixed(1)} (threshold: ${strategy.rsiOverbought})`,
          };
        }
      }

      return { signal: 'HOLD', reason: `RSI at ${currRsi.toFixed(1)} (neutral zone)` };
    }

    case 'MACD_MOMENTUM': {
      const { macdLine, signalLine, histogram } = calculateMACD(
        closes,
        strategy.macdFast,
        strategy.macdSlow,
        strategy.macdSignal
      );

      const currMacd = macdLine[lastIndex];
      const currSig = signalLine[lastIndex];
      const prevMacd = macdLine[prevIndex];
      const prevSig = signalLine[prevIndex];
      const currHist = histogram[lastIndex];

      if (currMacd === null || currSig === null || prevMacd === null || prevSig === null) {
        return { signal: 'HOLD', reason: 'MACD warming up' };
      }

      // Bullish MACD crossover + positive histogram
      if (prevMacd <= prevSig && currMacd > currSig) {
        if (currentPositionSide !== 'LONG') {
          return {
            signal: 'BUY',
            reason: `MACD Bullish Crossover: MACD line crossed above Signal line (Hist: ${currHist?.toFixed(2)})`,
          };
        }
      }

      // Bearish MACD crossover
      if (prevMacd >= prevSig && currMacd < currSig) {
        if (currentPositionSide === 'LONG') {
          return {
            signal: 'SELL',
            reason: `MACD Bearish Crossover: MACD line crossed below Signal line`,
          };
        }
      }

      return { signal: 'HOLD', reason: 'MACD momentum neutral' };
    }

    case 'BOLLINGER_BREAKOUT': {
      const { upper, lower, middle } = calculateBollingerBands(
        closes,
        strategy.bollingerPeriod,
        strategy.bollingerStdDev
      );

      const currUpper = upper[lastIndex];
      const currLower = lower[lastIndex];
      const currMid = middle[lastIndex];
      const prevClose = closes[prevIndex];
      const prevLower = lower[prevIndex];

      if (currUpper === null || currLower === null || currMid === null) {
        return { signal: 'HOLD', reason: 'Bollinger Bands warming up' };
      }

      // Buy when price bounces off or re-enters from lower band
      if (prevClose <= (prevLower || currLower) && currentPrice > currLower) {
        if (currentPositionSide !== 'LONG') {
          return {
            signal: 'BUY',
            reason: `Bollinger Lower Band Rebound: Price bounced off $${currLower.toFixed(2)}`,
          };
        }
      }

      // Sell when price reaches upper band or crosses back below middle
      if (currentPrice >= currUpper) {
        if (currentPositionSide === 'LONG') {
          return {
            signal: 'SELL',
            reason: `Bollinger Upper Band Reached: Price touched $${currUpper.toFixed(2)}`,
          };
        }
      }

      return { signal: 'HOLD', reason: 'Price within Bollinger channel' };
    }

    case 'GRID_TRADING': {
      // Basic oscillation logic around SMA20
      const sma = calculateSMA(closes, 20);
      const currSma = sma[lastIndex];
      if (currSma === null) return { signal: 'HOLD', reason: 'Grid reference warming up' };

      const deviation = (currentPrice - currSma) / currSma;
      if (deviation < -0.015 && currentPositionSide !== 'LONG') {
        return { signal: 'BUY', reason: `Grid Buy: Price ${Math.abs(deviation * 100).toFixed(1)}% below mean` };
      }
      if (deviation > 0.015 && currentPositionSide === 'LONG') {
        return { signal: 'SELL', reason: `Grid Sell: Price ${(deviation * 100).toFixed(1)}% above mean` };
      }
      return { signal: 'HOLD', reason: 'Grid range equilibrium' };
    }

    default:
      return { signal: 'HOLD', reason: 'Unknown strategy' };
  }
}
