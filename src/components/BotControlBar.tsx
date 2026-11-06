import React from 'react';
import { BotState } from '../types/trading';
import { SUPPORTED_ASSETS, MarketAsset } from '../utils/marketData';
import { Play, Pause, Square, AlertOctagon, RefreshCw, Zap, BookOpen } from 'lucide-react';

interface BotControlBarProps {
  botState: BotState;
  selectedAsset: MarketAsset;
  onSelectAsset: (asset: MarketAsset) => void;
  onToggleBot: () => void;
  onStopBot: () => void;
  onEmergencyFlatten: () => void;
  onResetBalance: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
  totalEquity: number;
  freeCash: number;
  dailyPnlUSD: number;
  dailyPnlPercent: number;
  onOpenGuide: () => void;
}

export const BotControlBar: React.FC<BotControlBarProps> = ({
  botState,
  selectedAsset,
  onSelectAsset,
  onToggleBot,
  onStopBot,
  onEmergencyFlatten,
  onResetBalance,
  simSpeed,
  onSetSimSpeed,
  totalEquity,
  freeCash,
  dailyPnlUSD,
  dailyPnlPercent,
  onOpenGuide,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Primary Top Bar (Contract: 3 Zones) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-5 h-5 text-emerald-400" />
          <a href="/" className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap">
            QuantBot Pro
          </a>
        </div>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#chart-view" className="hover:text-slate-100 transition-colors whitespace-nowrap">
            Chart View
          </a>
          <a href="#strategy-studio" className="hover:text-slate-100 transition-colors whitespace-nowrap">
            Strategy Studio
          </a>
          <a href="#ai-copilot" className="hover:text-slate-100 transition-colors whitespace-nowrap">
            AI Quant Copilot
          </a>
          <a href="#order-book" className="hover:text-slate-100 transition-colors whitespace-nowrap">
            Order Book
          </a>
          <a href="#trade-ledger" className="hover:text-slate-100 transition-colors whitespace-nowrap">
            Trade Ledger
          </a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-emerald-400 transition-colors whitespace-nowrap"
            title="راهنما و دستورالعمل استفاده / User Guide"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>راهنما / Guide</span>
          </button>
          <button
            onClick={onEmergencyFlatten}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition-colors whitespace-nowrap"
            title="Liquidate all open positions to cash immediately"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            Emergency Flatten
          </button>
        </div>
      </header>

      {/* Workspace Control Strip & Real-time Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-900/70 border border-slate-800/80 rounded-xl shadow-md">
        {/* Left: Asset Selector & Bot Run Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Asset Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Market:</span>
            <select
              value={selectedAsset.symbol}
              onChange={(e) => {
                const found = SUPPORTED_ASSETS.find((a) => a.symbol === e.target.value);
                if (found) onSelectAsset(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} ({asset.name})
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Bot State Switch */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleBot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                botState === 'RUNNING'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {botState === 'RUNNING' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Bot
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Start Bot
                </>
              )}
            </button>

            {botState !== 'STOPPED' && (
              <button
                onClick={onStopBot}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                title="Stop Bot"
              >
                <Square className="w-3.5 h-3.5" />
                Stop
              </button>
            )}

            <span className="text-xs font-mono ml-1">
              {botState === 'RUNNING' && (
                <span className="text-emerald-400 font-semibold">● ACTIVE RUNNING</span>
              )}
              {botState === 'PAUSED' && (
                <span className="text-amber-400 font-semibold">❚❚ PAUSED</span>
              )}
              {botState === 'STOPPED' && (
                <span className="text-slate-500 font-semibold">■ IDLE</span>
              )}
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Speed:</span>
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => onSetSimSpeed(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    simSpeed === s
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Portfolio Balances & PnL */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-sans">Total Portfolio</span>
            <span className="font-bold text-slate-100 text-sm tabular-nums">
              ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-sans">Available Cash</span>
            <span className="text-slate-300 tabular-nums">
              ${freeCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-sans">Session PnL</span>
            <span
              className={`font-semibold tabular-nums ${
                dailyPnlUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {dailyPnlUSD >= 0 ? '+' : ''}${dailyPnlUSD.toFixed(2)} ({dailyPnlPercent >= 0 ? '+' : ''}{dailyPnlPercent.toFixed(2)}%)
            </span>
          </div>

          <button
            onClick={onResetBalance}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-sans transition-colors"
            title="Reset simulated portfolio to $10,000"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
