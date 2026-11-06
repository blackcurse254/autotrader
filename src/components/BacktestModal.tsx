import React, { useState } from 'react';
import { BacktestMetrics } from '../types/trading';
import { X, TrendingUp, Award, AlertTriangle, Activity, Download, CheckCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BacktestModalProps {
  metrics: BacktestMetrics;
  strategyName: string;
  onClose: () => void;
}

export const BacktestModal: React.FC<BacktestModalProps> = ({
  metrics,
  strategyName,
  onClose,
}) => {
  const [tab, setTab] = useState<'METRICS' | 'TRADES'>('METRICS');

  // Export trades to CSV
  const exportCSV = () => {
    const headers = ['TradeID,Symbol,Side,EntryPrice,ExitPrice,Amount,PnL_USD,PnL_Pct,Reason\n'];
    const rows = metrics.trades.map(
      (t) =>
        `${t.id},${t.symbol},${t.side},${t.entryPrice},${t.exitPrice},${t.amount},${t.realizedPnlUSD},${t.realizedPnlPercent}%,${t.exitReason}`
    );
    const csvContent = headers.join('') + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${strategyName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Equity curve rendering
  const curveWidth = 720;
  const curveHeight = 180;
  const padding = 20;

  const equities = metrics.equityCurve.map((d) => d.equity);
  const benchmarks = metrics.equityCurve.map((d) => d.benchmark);
  const minEq = Math.min(...equities, ...benchmarks, metrics.initialCapital * 0.9);
  const maxEq = Math.max(...equities, ...benchmarks, metrics.initialCapital * 1.1);
  const eqRange = maxEq - minEq || 1;

  const getEqY = (val: number) => {
    return curveHeight - padding - ((val - minEq) / eqRange) * (curveHeight - padding * 2);
  };

  const stepX = (curveWidth - padding * 2) / Math.max(metrics.equityCurve.length - 1, 1);

  const equityPath = metrics.equityCurve.reduce((acc, pt, i) => {
    const x = padding + i * stepX;
    const y = getEqY(pt.equity);
    return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const benchmarkPath = metrics.equityCurve.reduce((acc, pt, i) => {
    const x = padding + i * stepX;
    const y = getEqY(pt.benchmark);
    return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const isNetPositive = metrics.netProfitUSD >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-100">
                Backtest Results: {strategyName}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated institutional backtest across {metrics.equityCurve.length} historical bars.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-slate-800 text-xs">
          <button
            onClick={() => setTab('METRICS')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              tab === 'METRICS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Performance Overview
          </button>
          <button
            onClick={() => setTab('TRADES')}
            className={`pb-2.5 font-medium border-b-2 transition-colors ${
              tab === 'TRADES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Trade Ledger ({metrics.totalTrades})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'METRICS' ? (
            <>
              {/* Primary Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Total Return</span>
                  <div
                    className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                      isNetPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isNetPositive ? '+' : ''}{metrics.totalReturnPercent}%
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    PnL: {isNetPositive ? '+' : ''}${metrics.netProfitUSD.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Win Rate</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                    {metrics.winRatePercent}%
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {metrics.winningTrades}W / {metrics.losingTrades}L ({metrics.totalTrades} trades)
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Profit Factor</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
                    {metrics.profitFactor >= 99 ? '∞' : metrics.profitFactor.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Sharpe: {metrics.sharpeRatio.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Max Drawdown</span>
                  <div className="text-xl font-bold font-mono tabular-nums text-rose-400 mt-1">
                    -{metrics.maxDrawdownPercent}%
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    B&H Return: {metrics.buyAndHoldReturnPercent > 0 ? '+' : ''}
                    {metrics.buyAndHoldReturnPercent}%
                  </span>
                </div>
              </div>

              {/* Equity Curve SVG */}
              <div className="flex flex-col gap-2 p-4 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-200">Equity Growth Curve</span>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-0.5 bg-emerald-400"></span>
                      <span>Bot Strategy (${metrics.finalEquity.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-0.5 bg-slate-500"></span>
                      <span>Buy & Hold Benchmark</span>
                    </div>
                  </div>
                </div>

                <div className="w-full overflow-hidden mt-1">
                  <svg viewBox={`0 0 ${curveWidth} ${curveHeight}`} className="w-full h-auto">
                    {/* Baseline */}
                    <line
                      x1={padding}
                      y1={getEqY(metrics.initialCapital)}
                      x2={curveWidth - padding}
                      y2={getEqY(metrics.initialCapital)}
                      stroke="#334155"
                      strokeDasharray="3 3"
                    />

                    {/* Benchmark curve */}
                    <path
                      d={benchmarkPath}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Bot Equity Curve */}
                    <path
                      d={equityPath}
                      fill="none"
                      stroke={isNetPositive ? '#10b981' : '#f43f5e'}
                      strokeWidth="2.2"
                    />
                  </svg>
                </div>
              </div>

              {/* Statistical Details Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-500">Initial Capital</span>
                  <div className="font-mono tabular-nums text-slate-200 font-semibold mt-0.5">
                    ${metrics.initialCapital.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-500">Final Equity</span>
                  <div className="font-mono tabular-nums text-slate-200 font-semibold mt-0.5">
                    ${metrics.finalEquity.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-500">Best Trade PnL</span>
                  <div className="font-mono tabular-nums text-emerald-400 font-semibold mt-0.5">
                    +${metrics.bestTradeUSD.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
                  <span className="text-slate-500">Worst Trade PnL</span>
                  <div className="font-mono tabular-nums text-rose-400 font-semibold mt-0.5">
                    ${metrics.worstTradeUSD.toFixed(2)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Trades Table */
            <div className="overflow-x-auto">
              {metrics.trades.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No trades were triggered during this historical period. Try relaxing the indicator thresholds.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3 font-medium">Trade #</th>
                      <th className="py-2.5 px-3 font-medium">Side</th>
                      <th className="py-2.5 px-3 font-medium">Entry Price</th>
                      <th className="py-2.5 px-3 font-medium">Exit Price</th>
                      <th className="py-2.5 px-3 font-medium">Net PnL ($)</th>
                      <th className="py-2.5 px-3 font-medium">PnL (%)</th>
                      <th className="py-2.5 px-3 font-medium">Exit Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metrics.trades.map((t, idx) => {
                      const isWin = t.realizedPnlUSD >= 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 font-mono text-slate-400">#{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-emerald-400">{t.side}</td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-200">
                            ${t.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono tabular-nums text-slate-200">
                            ${t.exitPrice.toFixed(2)}
                          </td>
                          <td
                            className={`py-2 px-3 font-mono tabular-nums font-semibold ${
                              isWin ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isWin ? '+' : ''}${t.realizedPnlUSD.toFixed(2)}
                          </td>
                          <td
                            className={`py-2 px-3 font-mono tabular-nums font-semibold ${
                              isWin ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isWin ? '+' : ''}{t.realizedPnlPercent.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {t.exitReason === 'STOP_LOSS' && 'Hard Stop Loss'}
                            {t.exitReason === 'TAKE_PROFIT' && 'Take Profit Target'}
                            {t.exitReason === 'TRAILING_STOP' && 'Trailing Stop'}
                            {t.exitReason === 'SIGNAL' && 'Indicator Reversal'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div>Modeled with exchange trading fees and execution slippage.</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
