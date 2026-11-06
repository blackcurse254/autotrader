import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Candle,
  StrategyConfig,
  Position,
  TradeRecord,
  ExecutionLog,
  BotState,
  BacktestMetrics,
} from './types/trading';
import { SUPPORTED_ASSETS, MarketAsset, generateHistoricalCandles, simulateTick, generateOrderBook } from './utils/marketData';
import { evaluateStrategySignal } from './utils/indicators';
import { runBacktest } from './utils/backtestEngine';
import { generatePythonCCXTCode } from './utils/pythonBotTemplate';
import { CandlestickChart } from './components/CandlestickChart';
import { StrategyStudio } from './components/StrategyStudio';
import { OrderBookWidget } from './components/OrderBookWidget';
import { TradeHistoryAndPositions } from './components/TradeHistoryAndPositions';
import { BotControlBar } from './components/BotControlBar';
import { BacktestModal } from './components/BacktestModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { AiQuantCopilot } from './components/AiQuantCopilot';
import { UserGuideModal } from './components/UserGuideModal';

const INITIAL_CAPITAL = 10000;

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(SUPPORTED_ASSETS[0]);
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateHistoricalCandles(SUPPORTED_ASSETS[0], 120, 'RECENT', 60)
  );
  const [currentPrice, setCurrentPrice] = useState<number>(() => {
    return SUPPORTED_ASSETS[0].basePrice;
  });

  const [botState, setBotState] = useState<BotState>('RUNNING');
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x

  const [cash, setCash] = useState<number>(INITIAL_CAPITAL);
  const [position, setPosition] = useState<Position | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>(() => [
    {
      id: 'init-1',
      timestamp: Date.now() - 5000,
      type: 'INFO',
      message: `QuantBot initialized for ${SUPPORTED_ASSETS[0].symbol} with $10,000 USDT paper balance.`,
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 2000,
      type: 'INFO',
      message: 'Dual Moving Average (9/21) crossover strategy engine running.',
    },
  ]);

  const [strategy, setStrategy] = useState<StrategyConfig>({
    id: 'strat-1',
    name: 'Dual Moving Average Crossover',
    description: 'Golden Cross (9 fast / 21 slow) for capturing momentum trends with dynamic risk guards.',
    type: 'SMA_CROSS',
    fastPeriod: 9,
    slowPeriod: 21,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    bollingerPeriod: 20,
    bollingerStdDev: 2,
    orderSizePercent: 25,
    stopLossPercent: 2.0,
    takeProfitPercent: 5.0,
    trailingStopPercent: 1.5,
    leverage: 1,
    makerFeePercent: 0.02,
    takerFeePercent: 0.05,
    slippagePercent: 0.02,
  });

  // Modals
  const [backtestModalOpen, setBacktestModalOpen] = useState(false);
  const [backtestMetrics, setBacktestMetrics] = useState<BacktestMetrics | null>(null);
  const [pythonModalOpen, setPythonModalOpen] = useState(false);
  const [pythonCode, setPythonCode] = useState<string>('');
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  // Order Book state
  const orderBook = useMemo(() => {
    return generateOrderBook(currentPrice, selectedAsset.decimalPlaces);
  }, [currentPrice, selectedAsset.decimalPlaces]);

  // Keep ref to avoid stale closures in tick interval
  const stateRef = useRef({
    candles,
    position,
    cash,
    strategy,
    botState,
    selectedAsset,
    trades,
  });

  useEffect(() => {
    stateRef.current = {
      candles,
      position,
      cash,
      strategy,
      botState,
      selectedAsset,
      trades,
    };
  }, [candles, position, cash, strategy, botState, selectedAsset, trades]);

  // Handle switching asset
  const handleSelectAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    setCurrentPrice(asset.basePrice);
    const newCandles = generateHistoricalCandles(asset, 120, 'RECENT', 60);
    setCandles(newCandles);
    addLog('INFO', `Switched active market to ${asset.symbol} (${asset.name}).`);
  };

  const addLog = (type: ExecutionLog['type'], message: string) => {
    const newLog: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 75)]);
  };

  // Run Backtest
  const handleRunBacktest = () => {
    try {
      const metrics = runBacktest(candles, strategy, INITIAL_CAPITAL);
      setBacktestMetrics(metrics);
      setBacktestModalOpen(true);
      addLog('INFO', `Completed backtest for ${strategy.name}: ${metrics.totalReturnPercent}% Return (${metrics.winRatePercent}% Win Rate)`);
    } catch (e: any) {
      addLog('ALERT', `Backtest failed: ${e.message}`);
    }
  };

  // Open Python Code Modal
  const handleOpenPythonModal = (customCode?: string) => {
    const code = customCode || generatePythonCCXTCode(strategy, selectedAsset.symbol);
    setPythonCode(code);
    setPythonModalOpen(true);
  };

  // Reset balance
  const handleResetBalance = () => {
    setPosition(null);
    setCash(INITIAL_CAPITAL);
    setTrades([]);
    addLog('INFO', 'Portfolio balance reset to $10,000 USDT.');
  };

  // Emergency Flatten
  const handleEmergencyFlatten = () => {
    if (!position) {
      addLog('INFO', 'Emergency Flatten triggered: No active positions to liquidate.');
      return;
    }
    const exitPrice = currentPrice * (1 - strategy.slippagePercent / 100);
    const proceeds = position.amount * exitPrice;
    const fee = proceeds * (strategy.takerFeePercent / 100);
    const netProceeds = proceeds - fee;
    const cost = position.amount * position.entryPrice;
    const pnlUSD = netProceeds - cost;
    const pnlPercent = (pnlUSD / cost) * 100;

    const closedTrade: TradeRecord = {
      id: `trade-${Date.now()}`,
      symbol: position.symbol,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice,
      amount: position.amount,
      entryTime: position.entryTime,
      exitTime: Date.now(),
      realizedPnlUSD: Number(pnlUSD.toFixed(2)),
      realizedPnlPercent: Number(pnlPercent.toFixed(2)),
      feeUSD: Number(fee.toFixed(2)),
      exitReason: 'MANUAL',
    };

    setCash((c) => c + netProceeds);
    setTrades((t) => [...t, closedTrade]);
    setPosition(null);
    addLog('ALERT', `EMERGENCY FLATTEN: Closed ${position.amount.toFixed(4)} ${position.symbol} @ $${exitPrice.toFixed(2)} | Net PnL: ${pnlUSD >= 0 ? '+' : ''}$${pnlUSD.toFixed(2)}`);
  };

  // Manual Order Placement Override
  const handlePlaceManualOrder = (side: 'BUY' | 'SELL', price: number, amountPct: number) => {
    if (side === 'BUY') {
      if (position) {
        addLog('ALERT', 'Manual order rejected: Already holding an active position.');
        return;
      }
      const allocatedUSD = (cash * (amountPct / 100)) * strategy.leverage;
      const fillPrice = price * (1 + strategy.slippagePercent / 100);
      const fee = allocatedUSD * (strategy.takerFeePercent / 100);
      const netAllocated = allocatedUSD - fee;
      const amount = netAllocated / fillPrice;

      if (cash < allocatedUSD / strategy.leverage) {
        addLog('ALERT', 'Manual order rejected: Insufficient cash balance.');
        return;
      }

      setCash((c) => c - allocatedUSD / strategy.leverage);

      const stopLossPrice = strategy.stopLossPercent > 0 ? fillPrice * (1 - strategy.stopLossPercent / 100) : undefined;
      const takeProfitPrice = strategy.takeProfitPercent > 0 ? fillPrice * (1 + strategy.takeProfitPercent / 100) : undefined;

      const newPos: Position = {
        id: `pos-${Date.now()}`,
        symbol: selectedAsset.symbol,
        side: 'LONG',
        entryPrice: fillPrice,
        currentPrice: fillPrice,
        amount,
        entryTime: Date.now(),
        leverage: strategy.leverage,
        stopLossPrice,
        takeProfitPrice,
        highestPriceSinceEntry: fillPrice,
        unrealizedPnlUSD: 0,
        unrealizedPnlPercent: 0,
        marginUsed: allocatedUSD / strategy.leverage,
      };

      setPosition(newPos);
      addLog('ORDER', `Manual BUY Market Filled: ${amount.toFixed(4)} ${selectedAsset.symbol} @ $${fillPrice.toFixed(2)} ($${allocatedUSD.toFixed(2)})`);
    } else {
      // SELL / CLOSE
      if (!position) {
        addLog('ALERT', 'Manual Sell rejected: No open long position to close.');
        return;
      }
      handleEmergencyFlatten();
    }
  };

  // Real-time Simulation Engine Tick Loop
  useEffect(() => {
    const intervalMs = Math.max(100, Math.floor(1000 / simSpeed));

    const timer = setInterval(() => {
      const {
        candles: currentCandles,
        position: currentPos,
        cash: currentCash,
        strategy: currentStrat,
        botState: currentBotState,
        selectedAsset: currAsset,
      } = stateRef.current;

      if (currentCandles.length === 0) return;

      const lastCandle = currentCandles[currentCandles.length - 1];
      const { updatedCandle, isNewCandle, lastTickPrice } = simulateTick(lastCandle, currAsset, 60);

      setCurrentPrice(lastTickPrice);

      let nextCandles: Candle[];
      if (isNewCandle) {
        nextCandles = [...currentCandles.slice(1), updatedCandle];
      } else {
        nextCandles = [...currentCandles.slice(0, -1), updatedCandle];
      }
      setCandles(nextCandles);

      // Evaluate Active Position Risk Guards (SL / TP / Trailing Stop)
      if (currentPos) {
        const markPrice = lastTickPrice;
        const highest = Math.max(currentPos.highestPriceSinceEntry || currentPos.entryPrice, markPrice);
        const grossValue = currentPos.amount * markPrice;
        const costValue = currentPos.amount * currentPos.entryPrice;
        const unrealizedUSD = (grossValue - costValue) * currentPos.leverage;
        const unrealizedPct = ((markPrice - currentPos.entryPrice) / currentPos.entryPrice) * 100 * currentPos.leverage;

        let shouldExit = false;
        let exitReason: TradeRecord['exitReason'] = 'SIGNAL';
        let exitPrice = markPrice;

        // Stop Loss Check
        if (currentPos.stopLossPrice && markPrice <= currentPos.stopLossPrice) {
          shouldExit = true;
          exitReason = 'STOP_LOSS';
          exitPrice = currentPos.stopLossPrice;
        }
        // Take Profit Check
        else if (currentPos.takeProfitPrice && markPrice >= currentPos.takeProfitPrice) {
          shouldExit = true;
          exitReason = 'TAKE_PROFIT';
          exitPrice = currentPos.takeProfitPrice;
        }
        // Trailing Stop Check
        else if (currentStrat.trailingStopPercent > 0) {
          const trailingLevel = highest * (1 - currentStrat.trailingStopPercent / 100);
          if (markPrice <= trailingLevel) {
            shouldExit = true;
            exitReason = 'TRAILING_STOP';
            exitPrice = trailingLevel;
          }
        }

        if (shouldExit) {
          const exitFill = exitPrice * (1 - currentStrat.slippagePercent / 100);
          const grossProceeds = currentPos.amount * exitFill;
          const fee = grossProceeds * (currentStrat.takerFeePercent / 100);
          const netProceeds = grossProceeds - fee;
          const cost = currentPos.amount * currentPos.entryPrice;
          const realizedUSD = (netProceeds - cost) * currentPos.leverage;
          const realizedPct = (realizedUSD / currentPos.marginUsed) * 100;

          const trade: TradeRecord = {
            id: `trade-${Date.now()}`,
            symbol: currentPos.symbol,
            side: currentPos.side,
            entryPrice: currentPos.entryPrice,
            exitPrice: exitFill,
            amount: currentPos.amount,
            entryTime: currentPos.entryTime,
            exitTime: Date.now(),
            realizedPnlUSD: Number(realizedUSD.toFixed(2)),
            realizedPnlPercent: Number(realizedPct.toFixed(2)),
            feeUSD: Number(fee.toFixed(2)),
            exitReason,
          };

          setCash((c) => c + currentPos.marginUsed + realizedUSD);
          setTrades((prev) => [...prev, trade]);
          setPosition(null);
          addLog(
            realizedUSD >= 0 ? 'ORDER' : 'RISK',
            `Bot Exit (${exitReason}): ${currentPos.side} closed @ $${exitFill.toFixed(2)} | Net: ${realizedUSD >= 0 ? '+' : ''}$${realizedUSD.toFixed(2)} (${realizedPct.toFixed(2)}%)`
          );
        } else {
          // Update position mark metrics
          setPosition({
            ...currentPos,
            currentPrice: markPrice,
            highestPriceSinceEntry: highest,
            unrealizedPnlUSD: Number(unrealizedUSD.toFixed(2)),
            unrealizedPnlPercent: Number(unrealizedPct.toFixed(2)),
          });
        }
      }

      // If Bot is Running, evaluate automated Strategy Signals
      if (currentBotState === 'RUNNING') {
        const { signal, reason } = evaluateStrategySignal(
          nextCandles,
          currentStrat,
          currentPos ? currentPos.side : null
        );

        if (signal === 'BUY' && !currentPos) {
          const allocatedUSD = (currentCash * (currentStrat.orderSizePercent / 100)) * currentStrat.leverage;
          const fillPrice = lastTickPrice * (1 + currentStrat.slippagePercent / 100);
          const fee = allocatedUSD * (currentStrat.takerFeePercent / 100);
          const netAllocated = allocatedUSD - fee;
          const amount = netAllocated / fillPrice;

          if (currentCash >= allocatedUSD / currentStrat.leverage && amount > 0) {
            setCash((c) => c - allocatedUSD / currentStrat.leverage);

            const stopLossPrice = currentStrat.stopLossPercent > 0 ? fillPrice * (1 - currentStrat.stopLossPercent / 100) : undefined;
            const takeProfitPrice = currentStrat.takeProfitPercent > 0 ? fillPrice * (1 + currentStrat.takeProfitPercent / 100) : undefined;

            const newPos: Position = {
              id: `pos-${Date.now()}`,
              symbol: currAsset.symbol,
              side: 'LONG',
              entryPrice: fillPrice,
              currentPrice: fillPrice,
              amount,
              entryTime: Date.now(),
              leverage: currentStrat.leverage,
              stopLossPrice,
              takeProfitPrice,
              highestPriceSinceEntry: fillPrice,
              unrealizedPnlUSD: 0,
              unrealizedPnlPercent: 0,
              marginUsed: allocatedUSD / currentStrat.leverage,
            };

            setPosition(newPos);
            addLog('SIGNAL', `[SIGNAL: BUY] ${reason}`);
            addLog('ORDER', `Bot Opened LONG: ${amount.toFixed(4)} ${currAsset.symbol} @ $${fillPrice.toFixed(2)} (Alloc: $${allocatedUSD.toFixed(2)})`);
          }
        } else if (signal === 'SELL' && currentPos) {
          // Strategy signal exit
          const exitFill = lastTickPrice * (1 - currentStrat.slippagePercent / 100);
          const grossProceeds = currentPos.amount * exitFill;
          const fee = grossProceeds * (currentStrat.takerFeePercent / 100);
          const netProceeds = grossProceeds - fee;
          const cost = currentPos.amount * currentPos.entryPrice;
          const realizedUSD = (netProceeds - cost) * currentPos.leverage;
          const realizedPct = (realizedUSD / currentPos.marginUsed) * 100;

          const trade: TradeRecord = {
            id: `trade-${Date.now()}`,
            symbol: currentPos.symbol,
            side: currentPos.side,
            entryPrice: currentPos.entryPrice,
            exitPrice: exitFill,
            amount: currentPos.amount,
            entryTime: currentPos.entryTime,
            exitTime: Date.now(),
            realizedPnlUSD: Number(realizedUSD.toFixed(2)),
            realizedPnlPercent: Number(realizedPct.toFixed(2)),
            feeUSD: Number(fee.toFixed(2)),
            exitReason: 'SIGNAL',
          };

          setCash((c) => c + currentPos.marginUsed + realizedUSD);
          setTrades((prev) => [...prev, trade]);
          setPosition(null);
          addLog('SIGNAL', `[SIGNAL: SELL] ${reason}`);
          addLog('ORDER', `Bot Closed LONG: @ $${exitFill.toFixed(2)} | Net PnL: ${realizedUSD >= 0 ? '+' : ''}$${realizedUSD.toFixed(2)}`);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simSpeed]);

  // Derived portfolio metrics
  const totalEquity = useMemo(() => {
    const posVal = position ? position.marginUsed + position.unrealizedPnlUSD : 0;
    return cash + posVal;
  }, [cash, position]);

  const totalSessionPnl = totalEquity - INITIAL_CAPITAL;
  const totalSessionPnlPercent = (totalSessionPnl / INITIAL_CAPITAL) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Bot Controls */}
      <BotControlBar
        botState={botState}
        selectedAsset={selectedAsset}
        onSelectAsset={handleSelectAsset}
        onToggleBot={() => setBotState((prev) => (prev === 'RUNNING' ? 'PAUSED' : 'RUNNING'))}
        onStopBot={() => setBotState('STOPPED')}
        onEmergencyFlatten={handleEmergencyFlatten}
        onResetBalance={handleResetBalance}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        totalEquity={totalEquity}
        freeCash={cash}
        dailyPnlUSD={totalSessionPnl}
        dailyPnlPercent={totalSessionPnlPercent}
        onOpenGuide={() => setGuideModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5">
        {/* Top Grid: Main Candlestick Chart (2/3 width) + Order Book Depth (1/3 width) */}
        <section id="chart-view" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <CandlestickChart
              candles={candles}
              strategy={strategy}
              trades={trades}
              currentPrice={currentPrice}
            />
          </div>

          <div id="order-book" className="lg:col-span-4 flex flex-col gap-4">
            <OrderBookWidget
              orderBook={orderBook}
              symbol={selectedAsset.symbol}
              onPlaceManualOrder={handlePlaceManualOrder}
            />
          </div>
        </section>

        {/* Middle Section: Strategy Studio Controls */}
        <section id="strategy-studio">
          <StrategyStudio
            strategy={strategy}
            onUpdateStrategy={(upd) => setStrategy((prev) => ({ ...prev, ...upd }))}
            onRunBacktest={handleRunBacktest}
            onViewCode={() => handleOpenPythonModal()}
            onOpenDockerGuide={() => setGuideModalOpen(true)}
          />
        </section>

        {/* AI Quant Copilot Section */}
        <section id="ai-copilot">
          <AiQuantCopilot
            symbol={selectedAsset.symbol}
            currentPrice={currentPrice}
            onApplyStrategy={(upd) => {
              setStrategy((prev) => ({ ...prev, ...upd }));
              addLog('INFO', `Applied AI strategy: ${upd.name || 'Custom Strategy'}`);
            }}
            onLoadPythonCode={(code) => handleOpenPythonModal(code)}
          />
        </section>

        {/* Bottom Section: Positions, Trades & Real-time Bot Execution Logs */}
        <section id="trade-ledger">
          <TradeHistoryAndPositions
            position={position}
            trades={trades}
            logs={logs}
            onClosePosition={handleEmergencyFlatten}
            onClearLogs={() => setLogs([])}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>QuantBot Pro Engine</span>
          <span aria-hidden="true">·</span>
          <span>CCXT & Backtrader Compatible</span>
          <span aria-hidden="true">·</span>
          <span>Institutional Paper Trading Simulation</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleOpenPythonModal()}
            className="hover:text-slate-300 transition-colors"
          >
            Export Python Bot
          </button>
          <button
            onClick={handleRunBacktest}
            className="hover:text-slate-300 transition-colors"
          >
            Run Backtest
          </button>
        </div>
      </footer>

      {/* Backtest Results Modal */}
      {backtestModalOpen && backtestMetrics && (
        <BacktestModal
          metrics={backtestMetrics}
          strategyName={strategy.name}
          onClose={() => setBacktestModalOpen(false)}
        />
      )}

      {/* Python Code Export Modal */}
      {pythonModalOpen && (
        <PythonCodeModal
          code={pythonCode}
          strategyName={strategy.name}
          symbol={selectedAsset.symbol}
          onClose={() => setPythonModalOpen(false)}
        />
      )}

      {/* User Guide Modal */}
      {guideModalOpen && (
        <UserGuideModal onClose={() => setGuideModalOpen(false)} />
      )}
    </div>
  );
}
