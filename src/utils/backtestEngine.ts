import { BacktestMetrics, Candle, StrategyConfig, TradeRecord } from '../types/trading';
import { evaluateStrategySignal } from './indicators';

export function runBacktest(
  candles: Candle[],
  strategy: StrategyConfig,
  initialCapital = 10000
): BacktestMetrics {
  if (candles.length < 30) {
    throw new Error('Need at least 30 candles to run backtest');
  }

  let cash = initialCapital;
  let currentPosition: {
    side: 'LONG';
    amount: number;
    entryPrice: number;
    entryTime: number;
    highestPrice: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
  } | null = null;

  const trades: TradeRecord[] = [];
  const equityCurve: Array<{
    timestamp: number;
    equity: number;
    benchmark: number;
    drawdown: number;
  }> = [];

  const initialPrice = candles[0].close;
  let peakEquity = initialCapital;

  // Simulate candle by candle starting from 30th candle so indicators are warm
  for (let i = 25; i < candles.length; i++) {
    const historicalSlice = candles.slice(0, i + 1);
    const currentCandle = candles[i];
    const currentPrice = currentCandle.close;

    // Check if existing position hits Stop Loss or Take Profit or Trailing Stop
    if (currentPosition) {
      if (currentCandle.high > currentPosition.highestPrice) {
        currentPosition.highestPrice = currentCandle.high;
      }

      let shouldExit = false;
      let exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP' | 'SIGNAL' = 'SIGNAL';
      let exitPrice = currentPrice;

      // 1. Stop loss check
      if (
        currentPosition.stopLossPrice &&
        currentCandle.low <= currentPosition.stopLossPrice
      ) {
        shouldExit = true;
        exitReason = 'STOP_LOSS';
        exitPrice = currentPosition.stopLossPrice * (1 - strategy.slippagePercent / 100);
      }
      // 2. Take profit check
      else if (
        currentPosition.takeProfitPrice &&
        currentCandle.high >= currentPosition.takeProfitPrice
      ) {
        shouldExit = true;
        exitReason = 'TAKE_PROFIT';
        exitPrice = currentPosition.takeProfitPrice * (1 - strategy.slippagePercent / 100);
      }
      // 3. Trailing stop check
      else if (strategy.trailingStopPercent > 0) {
        const trailingStopLevel =
          currentPosition.highestPrice * (1 - strategy.trailingStopPercent / 100);
        if (currentCandle.low <= trailingStopLevel) {
          shouldExit = true;
          exitReason = 'TRAILING_STOP';
          exitPrice = trailingStopLevel;
        }
      }

      if (shouldExit) {
        const grossReturn = currentPosition.amount * exitPrice;
        const fee = grossReturn * (strategy.takerFeePercent / 100);
        const netProceeds = grossReturn - fee;
        const investedCost = currentPosition.amount * currentPosition.entryPrice;
        const pnlUSD = netProceeds - investedCost;
        const pnlPercent = (pnlUSD / investedCost) * 100;

        cash += netProceeds;
        trades.push({
          id: `bt-trade-${trades.length + 1}`,
          symbol: 'BTC/USDT',
          side: 'LONG',
          entryPrice: currentPosition.entryPrice,
          exitPrice,
          amount: currentPosition.amount,
          entryTime: currentPosition.entryTime,
          exitTime: currentCandle.timestamp,
          realizedPnlUSD: Number(pnlUSD.toFixed(2)),
          realizedPnlPercent: Number(pnlPercent.toFixed(2)),
          feeUSD: Number(fee.toFixed(2)),
          exitReason,
        });

        currentPosition = null;
      }
    }

    // Evaluate Strategy Signal
    const { signal } = evaluateStrategySignal(
      historicalSlice,
      strategy,
      currentPosition ? 'LONG' : null
    );

    // Process Signal
    if (signal === 'BUY' && !currentPosition) {
      // Enter position with allocated percentage of available cash
      const allocation = (cash * (strategy.orderSizePercent / 100)) * strategy.leverage;
      const entryPrice = currentPrice * (1 + strategy.slippagePercent / 100);
      const fee = allocation * (strategy.takerFeePercent / 100);
      const netAllocated = allocation - fee;
      const amount = netAllocated / entryPrice;

      if (amount > 0 && cash >= allocation / strategy.leverage) {
        cash -= allocation / strategy.leverage;

        const stopLossPrice =
          strategy.stopLossPercent > 0
            ? entryPrice * (1 - strategy.stopLossPercent / 100)
            : undefined;
        const takeProfitPrice =
          strategy.takeProfitPercent > 0
            ? entryPrice * (1 + strategy.takeProfitPercent / 100)
            : undefined;

        currentPosition = {
          side: 'LONG',
          amount,
          entryPrice,
          entryTime: currentCandle.timestamp,
          highestPrice: entryPrice,
          stopLossPrice,
          takeProfitPrice,
        };
      }
    } else if (signal === 'SELL' && currentPosition) {
      // Signal-based exit
      const exitPrice = currentPrice * (1 - strategy.slippagePercent / 100);
      const grossReturn = currentPosition.amount * exitPrice;
      const fee = grossReturn * (strategy.takerFeePercent / 100);
      const netProceeds = grossReturn - fee;
      const investedCost = currentPosition.amount * currentPosition.entryPrice;
      const pnlUSD = netProceeds - investedCost;
      const pnlPercent = (pnlUSD / investedCost) * 100;

      cash += netProceeds;
      trades.push({
        id: `bt-trade-${trades.length + 1}`,
        symbol: 'BTC/USDT',
        side: 'LONG',
        entryPrice: currentPosition.entryPrice,
        exitPrice,
        amount: currentPosition.amount,
        entryTime: currentPosition.entryTime,
        exitTime: currentCandle.timestamp,
        realizedPnlUSD: Number(pnlUSD.toFixed(2)),
        realizedPnlPercent: Number(pnlPercent.toFixed(2)),
        feeUSD: Number(fee.toFixed(2)),
        exitReason: 'SIGNAL',
      });

      currentPosition = null;
    }

    // Compute current total equity (cash + open position mark value)
    const openPositionValue = currentPosition ? currentPosition.amount * currentPrice : 0;
    const totalEquity = cash + openPositionValue;

    if (totalEquity > peakEquity) {
      peakEquity = totalEquity;
    }
    const currentDrawdown = ((peakEquity - totalEquity) / peakEquity) * 100;

    // Benchmark equity (Buy & Hold)
    const benchmarkEquity = initialCapital * (currentPrice / initialPrice);

    equityCurve.push({
      timestamp: currentCandle.timestamp,
      equity: Number(totalEquity.toFixed(2)),
      benchmark: Number(benchmarkEquity.toFixed(2)),
      drawdown: Number(currentDrawdown.toFixed(2)),
    });
  }

  // Close open position at end of backtest if any
  if (currentPosition) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const grossReturn = currentPosition.amount * exitPrice;
    const fee = grossReturn * (strategy.takerFeePercent / 100);
    const netProceeds = grossReturn - fee;
    const investedCost = currentPosition.amount * currentPosition.entryPrice;
    const pnlUSD = netProceeds - investedCost;
    const pnlPercent = (pnlUSD / investedCost) * 100;

    cash += netProceeds;
    trades.push({
      id: `bt-trade-${trades.length + 1}`,
      symbol: 'BTC/USDT',
      side: 'LONG',
      entryPrice: currentPosition.entryPrice,
      exitPrice,
      amount: currentPosition.amount,
      entryTime: currentPosition.entryTime,
      exitTime: lastCandle.timestamp,
      realizedPnlUSD: Number(pnlUSD.toFixed(2)),
      realizedPnlPercent: Number(pnlPercent.toFixed(2)),
      feeUSD: Number(fee.toFixed(2)),
      exitReason: 'SIGNAL',
    });
  }

  const finalEquity = cash;
  const netProfitUSD = Number((finalEquity - initialCapital).toFixed(2));
  const totalReturnPercent = Number(((netProfitUSD / initialCapital) * 100).toFixed(2));
  const lastPrice = candles[candles.length - 1].close;
  const buyAndHoldReturnPercent = Number(
    (((lastPrice - initialPrice) / initialPrice) * 100).toFixed(2)
  );

  const winningTrades = trades.filter((t) => t.realizedPnlUSD > 0);
  const losingTrades = trades.filter((t) => t.realizedPnlUSD < 0);
  const winRatePercent =
    trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0;

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.realizedPnlUSD, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnlUSD, 0));
  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? 99.9
        : 1.0
      : Number((grossProfit / grossLoss).toFixed(2));

  // Max Drawdown calculation
  let maxDrawdownPercent = 0;
  for (const pt of equityCurve) {
    if (pt.drawdown > maxDrawdownPercent) {
      maxDrawdownPercent = pt.drawdown;
    }
  }

  // Sharpe Ratio estimation (assuming risk free = 0)
  const returns = trades.map((t) => t.realizedPnlPercent);
  let sharpeRatio = 0;
  if (returns.length > 1) {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    sharpeRatio = stdDev === 0 ? 0 : Number(((meanReturn / stdDev) * Math.sqrt(365)).toFixed(2));
  }

  const avgTradePnlUSD =
    trades.length > 0 ? Number((netProfitUSD / trades.length).toFixed(2)) : 0;
  const bestTradeUSD = trades.length > 0 ? Math.max(...trades.map((t) => t.realizedPnlUSD)) : 0;
  const worstTradeUSD = trades.length > 0 ? Math.min(...trades.map((t) => t.realizedPnlUSD)) : 0;

  return {
    initialCapital,
    finalEquity: Number(finalEquity.toFixed(2)),
    netProfitUSD,
    totalReturnPercent,
    buyAndHoldReturnPercent,
    winRatePercent,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    sharpeRatio,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgTradePnlUSD,
    bestTradeUSD: Number(bestTradeUSD.toFixed(2)),
    worstTradeUSD: Number(worstTradeUSD.toFixed(2)),
    equityCurve,
    trades,
  };
}
