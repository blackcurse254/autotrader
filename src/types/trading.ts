export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  fastSma?: number;
  slowSma?: number;
  ema?: number;
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr?: number;
}

export type TradeSignal = 'BUY' | 'SELL' | 'HOLD';

export type StrategyType =
  | 'SMA_CROSS'
  | 'RSI_REVERSION'
  | 'MACD_MOMENTUM'
  | 'BOLLINGER_BREAKOUT'
  | 'GRID_TRADING';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  fastPeriod: number;
  slowPeriod: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  bollingerPeriod: number;
  bollingerStdDev: number;
  orderSizePercent: number; // % of available portfolio equity to allocate per trade
  stopLossPercent: number; // e.g. 2.0 = 2%
  takeProfitPercent: number; // e.g. 4.0 = 4%
  trailingStopPercent: number; // e.g. 1.5 = 1.5%
  leverage: number; // 1 = spot, >1 = margin/perp
  makerFeePercent: number; // 0.02%
  takerFeePercent: number; // 0.05%
  slippagePercent: number; // 0.02%
  gridLevels?: number;
  gridSpacingPercent?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  amount: number; // in base units, e.g. 0.25 BTC
  entryTime: number;
  leverage: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  highestPriceSinceEntry?: number;
  unrealizedPnlUSD: number;
  unrealizedPnlPercent: number;
  marginUsed: number;
  liquidationPrice?: number;
}

export interface Order {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  price: number;
  amount: number;
  totalUSD: number;
  fee: number;
  status: 'FILLED' | 'OPEN' | 'CANCELLED';
  triggerReason: string;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  amount: number;
  entryTime: number;
  exitTime: number;
  realizedPnlUSD: number;
  realizedPnlPercent: number;
  feeUSD: number;
  exitReason: 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP' | 'MANUAL';
}

export interface ExecutionLog {
  id: string;
  timestamp: number;
  type: 'INFO' | 'SIGNAL' | 'ORDER' | 'RISK' | 'ALERT';
  message: string;
  details?: Record<string, any>;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
  lastPrice: number;
}

export interface BacktestMetrics {
  initialCapital: number;
  finalEquity: number;
  netProfitUSD: number;
  totalReturnPercent: number;
  buyAndHoldReturnPercent: number;
  winRatePercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgTradePnlUSD: number;
  bestTradeUSD: number;
  worstTradeUSD: number;
  equityCurve: Array<{
    timestamp: number;
    equity: number;
    benchmark: number;
    drawdown: number;
  }>;
  trades: TradeRecord[];
}

export type BotState = 'RUNNING' | 'PAUSED' | 'STOPPED';
