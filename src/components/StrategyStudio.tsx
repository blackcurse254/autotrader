import React from 'react';
import { StrategyConfig, StrategyType } from '../types/trading';
import { Sliders, Shield, Zap, RefreshCw, Code2, Play, Container } from 'lucide-react';

interface StrategyStudioProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  onRunBacktest: () => void;
  onViewCode: () => void;
  onOpenDockerGuide?: () => void;
}

const STRATEGY_PRESETS: Array<{
  type: StrategyType;
  name: string;
  desc: string;
  defaults: Partial<StrategyConfig>;
}> = [
  {
    type: 'SMA_CROSS',
    name: 'Dual Moving Average Crossover',
    desc: 'Golden Cross (9 fast / 21 slow) for capturing major trend breakouts with minimal false reversals.',
    defaults: {
      type: 'SMA_CROSS',
      fastPeriod: 9,
      slowPeriod: 21,
      stopLossPercent: 2.5,
      takeProfitPercent: 6.0,
      trailingStopPercent: 1.5,
    },
  },
  {
    type: 'RSI_REVERSION',
    name: 'RSI Mean Reversion',
    desc: 'Buys when RSI dips below oversold (30) and rebounds, selling on overbought exhaustion (>70).',
    defaults: {
      type: 'RSI_REVERSION',
      rsiPeriod: 14,
      rsiOversold: 30,
      rsiOverbought: 70,
      stopLossPercent: 2.0,
      takeProfitPercent: 4.5,
      trailingStopPercent: 1.2,
    },
  },
  {
    type: 'MACD_MOMENTUM',
    name: 'MACD Momentum Crossover',
    desc: 'Capitalizes on momentum shifts when MACD line crosses signal with positive histogram expansion.',
    defaults: {
      type: 'MACD_MOMENTUM',
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      stopLossPercent: 2.2,
      takeProfitPercent: 5.5,
      trailingStopPercent: 1.5,
    },
  },
  {
    type: 'BOLLINGER_BREAKOUT',
    name: 'Bollinger Bands Volatility Breakout',
    desc: 'Captures explosive volatility expansions when price touches and bounces from lower 2-sigma band.',
    defaults: {
      type: 'BOLLINGER_BREAKOUT',
      bollingerPeriod: 20,
      bollingerStdDev: 2,
      stopLossPercent: 1.8,
      takeProfitPercent: 5.0,
      trailingStopPercent: 1.0,
    },
  },
  {
    type: 'GRID_TRADING',
    name: 'Mean-Reverting Grid Scalper',
    desc: 'Automated oscillation orders around 20-period moving average equilibrium, ideal for sideways ranges.',
    defaults: {
      type: 'GRID_TRADING',
      fastPeriod: 20,
      stopLossPercent: 3.5,
      takeProfitPercent: 2.5,
      trailingStopPercent: 0,
    },
  },
];

export const StrategyStudio: React.FC<StrategyStudioProps> = ({
  strategy,
  onUpdateStrategy,
  onRunBacktest,
  onViewCode,
  onOpenDockerGuide,
}) => {
  const handleSelectPreset = (preset: typeof STRATEGY_PRESETS[0]) => {
    onUpdateStrategy({
      name: preset.name,
      description: preset.desc,
      ...preset.defaults,
    });
  };

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm p-5 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Strategy Engine & Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure quantitative signals, mathematical triggers, and position risk controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDockerGuide && (
            <button
              onClick={onOpenDockerGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-xs font-semibold text-emerald-300 transition-colors whitespace-nowrap"
            >
              <Container className="w-3.5 h-3.5" />
              Docker Deploy
            </button>
          )}
          <button
            onClick={onViewCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            Python CCXT Code
          </button>
          <button
            onClick={onRunBacktest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            Run Backtest
          </button>
        </div>
      </div>

      {/* Strategy Preset Selector (Segmented buttons) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-400">Preset Quant Strategies</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {STRATEGY_PRESETS.map((preset) => {
            const isSelected = strategy.type === preset.type;
            return (
              <button
                key={preset.type}
                onClick={() => handleSelectPreset(preset)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-950/25 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {preset.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strategy Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {/* Box 1: Technical Indicator Settings */}
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Indicator Parameters
          </div>

          {strategy.type === 'SMA_CROSS' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Fast SMA Period:</span>
                  <span className="font-mono tabular-nums text-cyan-400 font-semibold">{strategy.fastPeriod} bars</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="50"
                  value={strategy.fastPeriod}
                  onChange={(e) => onUpdateStrategy({ fastPeriod: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Slow SMA Period:</span>
                  <span className="font-mono tabular-nums text-amber-400 font-semibold">{strategy.slowPeriod} bars</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={strategy.slowPeriod}
                  onChange={(e) => onUpdateStrategy({ slowPeriod: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {strategy.type === 'RSI_REVERSION' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">RSI Period:</span>
                  <span className="font-mono tabular-nums text-purple-400 font-semibold">{strategy.rsiPeriod}</span>
                </div>
                <input
                  type="range"
                  min="7"
                  max="28"
                  value={strategy.rsiPeriod}
                  onChange={(e) => onUpdateStrategy({ rsiPeriod: parseInt(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Oversold Buy Threshold:</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-semibold">{strategy.rsiOversold}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={strategy.rsiOversold}
                  onChange={(e) => onUpdateStrategy({ rsiOversold: parseInt(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Overbought Exit Threshold:</span>
                  <span className="font-mono tabular-nums text-rose-400 font-semibold">{strategy.rsiOverbought}</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="85"
                  value={strategy.rsiOverbought}
                  onChange={(e) => onUpdateStrategy({ rsiOverbought: parseInt(e.target.value) })}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {strategy.type === 'MACD_MOMENTUM' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MACD Fast Period:</span>
                  <span className="font-mono tabular-nums text-cyan-400 font-semibold">{strategy.macdFast}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={strategy.macdFast}
                  onChange={(e) => onUpdateStrategy({ macdFast: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MACD Slow Period:</span>
                  <span className="font-mono tabular-nums text-amber-400 font-semibold">{strategy.macdSlow}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="40"
                  value={strategy.macdSlow}
                  onChange={(e) => onUpdateStrategy({ macdSlow: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {strategy.type === 'BOLLINGER_BREAKOUT' && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Period:</span>
                  <span className="font-mono tabular-nums text-purple-400 font-semibold">{strategy.bollingerPeriod}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={strategy.bollingerPeriod}
                  onChange={(e) => onUpdateStrategy({ bollingerPeriod: parseInt(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Std Dev Multiplier:</span>
                  <span className="font-mono tabular-nums text-purple-400 font-semibold">{strategy.bollingerStdDev}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={strategy.bollingerStdDev}
                  onChange={(e) => onUpdateStrategy({ bollingerStdDev: parseFloat(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {strategy.type === 'GRID_TRADING' && (
            <div className="text-xs text-slate-400 leading-relaxed">
              Automated high-frequency grid scalping around equilibrium price with automated rebalancing.
            </div>
          )}
        </div>

        {/* Box 2: Risk Management Controls */}
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            Risk & Exit Safeguards
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Hard Stop Loss:</span>
              <span className="font-mono tabular-nums text-rose-400 font-semibold">{strategy.stopLossPercent}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.25"
              value={strategy.stopLossPercent}
              onChange={(e) => onUpdateStrategy({ stopLossPercent: parseFloat(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Take Profit Target:</span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">{strategy.takeProfitPercent}%</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="20"
              step="0.5"
              value={strategy.takeProfitPercent}
              onChange={(e) => onUpdateStrategy({ takeProfitPercent: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Trailing Stop Loss:</span>
              <span className="font-mono tabular-nums text-cyan-400 font-semibold">
                {strategy.trailingStopPercent > 0 ? `${strategy.trailingStopPercent}%` : 'Disabled'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={strategy.trailingStopPercent}
              onChange={(e) => onUpdateStrategy({ trailingStopPercent: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Box 3: Portfolio Sizing & Execution Fees */}
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Position Sizing & Fee Model
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Order Allocation (% of Equity):</span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">{strategy.orderSizePercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={strategy.orderSizePercent}
              onChange={(e) => onUpdateStrategy({ orderSizePercent: parseInt(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Leverage:</span>
              <span className="font-mono tabular-nums text-amber-400 font-semibold">{strategy.leverage}x {strategy.leverage === 1 ? '(Spot)' : '(Margin)'}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 5, 10].map((lev) => (
                <button
                  key={lev}
                  onClick={() => onUpdateStrategy({ leverage: lev })}
                  className={`py-1 text-xs font-mono font-medium rounded border ${
                    strategy.leverage === lev
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[11px]">Taker Fee:</span>
              <span className="font-mono tabular-nums text-slate-200">{strategy.takerFeePercent}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400 text-[11px]">Slippage Est:</span>
              <span className="font-mono tabular-nums text-slate-200">{strategy.slippagePercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
