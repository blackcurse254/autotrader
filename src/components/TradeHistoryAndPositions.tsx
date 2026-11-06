import React, { useState } from 'react';
import { ExecutionLog, Position, TradeRecord } from '../types/trading';
import { ShieldCheck, Download, Trash2, AlertCircle } from 'lucide-react';

interface TradeHistoryAndPositionsProps {
  position: Position | null;
  trades: TradeRecord[];
  logs: ExecutionLog[];
  onClosePosition: () => void;
  onClearLogs: () => void;
}

export const TradeHistoryAndPositions: React.FC<TradeHistoryAndPositionsProps> = ({
  position,
  trades,
  logs,
  onClosePosition,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'POSITION' | 'TRADES' | 'LOGS'>('POSITION');

  const exportCSV = () => {
    const headers = ['TradeID,Symbol,Side,EntryPrice,ExitPrice,Amount,PnL_USD,PnL_Pct,Reason\n'];
    const rows = trades.map(
      (t) =>
        `${t.id},${t.symbol},${t.side},${t.entryPrice},${t.exitPrice},${t.amount},${t.realizedPnlUSD},${t.realizedPnlPercent}%,${t.exitReason}`
    );
    const csvContent = headers.join('') + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm p-4 text-slate-200 shadow-xl">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('POSITION')}
            className={`pb-1.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'POSITION'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Active Position</span>
            {position && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('TRADES')}
            className={`pb-1.5 border-b-2 transition-colors ${
              activeTab === 'TRADES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Closed Trades ({trades.length})
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`pb-1.5 border-b-2 transition-colors ${
              activeTab === 'LOGS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Bot Execution Logs ({logs.length})
          </button>
        </div>

        {activeTab === 'TRADES' && trades.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        )}

        {activeTab === 'LOGS' && logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="pt-3 min-h-[140px] flex flex-col justify-center">
        {/* Tab 1: Active Position */}
        {activeTab === 'POSITION' && (
          <div>
            {!position ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <ShieldCheck className="w-6 h-6 mx-auto mb-1.5 text-slate-600" />
                No open positions. Bot is scanning market for strategy signals.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Symbol & Side</span>
                    <div className="font-semibold text-emerald-400 mt-0.5 font-mono">
                      {position.symbol} {position.side} ({position.leverage}x)
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Entry Price</span>
                    <div className="font-semibold text-slate-200 mt-0.5 font-mono tabular-nums">
                      ${position.entryPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Mark Price</span>
                    <div className="font-semibold text-slate-200 mt-0.5 font-mono tabular-nums">
                      ${position.currentPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Size</span>
                    <div className="font-semibold text-slate-200 mt-0.5 font-mono tabular-nums">
                      {position.amount.toFixed(4)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 text-[11px]">Stop / Target</span>
                    <div className="text-[11px] text-slate-300 mt-0.5 font-mono tabular-nums">
                      SL: ${position.stopLossPrice?.toFixed(1) || 'None'}<br/>
                      TP: ${position.takeProfitPrice?.toFixed(1) || 'None'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <span className="text-slate-500 text-[11px]">Unrealized PnL</span>
                    <div
                      className={`font-bold font-mono tabular-nums text-sm ${
                        position.unrealizedPnlUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {position.unrealizedPnlUSD >= 0 ? '+' : ''}${position.unrealizedPnlUSD.toFixed(2)}
                      {' '}({position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Margin Used: <strong className="text-slate-200 font-mono tabular-nums">${position.marginUsed.toFixed(2)}</strong></span>
                    {position.liquidationPrice && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400">Est. Liquidation: ${position.liquidationPrice.toFixed(2)}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={onClosePosition}
                    className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
                  >
                    Close Position (Market)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Closed Trades */}
        {activeTab === 'TRADES' && (
          <div className="overflow-x-auto max-h-56">
            {trades.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No closed trades yet in this session.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-1.5 px-2">Time</th>
                    <th className="py-1.5 px-2">Side</th>
                    <th className="py-1.5 px-2">Entry</th>
                    <th className="py-1.5 px-2">Exit</th>
                    <th className="py-1.5 px-2">Amount</th>
                    <th className="py-1.5 px-2 text-right">Realized PnL</th>
                    <th className="py-1.5 px-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {trades.slice().reverse().map((t) => {
                    const isWin = t.realizedPnlUSD >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-2 text-slate-400">
                          {new Date(t.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-1.5 px-2 font-semibold text-emerald-400">{t.side}</td>
                        <td className="py-1.5 px-2 tabular-nums">${t.entryPrice.toFixed(2)}</td>
                        <td className="py-1.5 px-2 tabular-nums">${t.exitPrice.toFixed(2)}</td>
                        <td className="py-1.5 px-2 tabular-nums text-slate-300">{t.amount.toFixed(4)}</td>
                        <td
                          className={`py-1.5 px-2 text-right tabular-nums font-bold ${
                            isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isWin ? '+' : ''}${t.realizedPnlUSD.toFixed(2)} ({isWin ? '+' : ''}{t.realizedPnlPercent.toFixed(2)}%)
                        </td>
                        <td className="py-1.5 px-2 text-slate-400 text-[10px]">
                          {t.exitReason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Bot Execution Logs */}
        {activeTab === 'LOGS' && (
          <div className="overflow-y-auto max-h-56 font-mono text-[11px] space-y-1.5 pr-2">
            {logs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-sans">
                Awaiting bot events...
              </div>
            ) : (
              logs.slice().reverse().map((log) => {
                let color = 'text-slate-300';
                if (log.type === 'SIGNAL') color = 'text-cyan-400 font-semibold';
                if (log.type === 'ORDER') color = 'text-emerald-400 font-semibold';
                if (log.type === 'RISK') color = 'text-amber-400 font-semibold';
                if (log.type === 'ALERT') color = 'text-rose-400 font-semibold';

                return (
                  <div key={log.id} className="flex items-start gap-2 py-0.5 border-b border-slate-800/40">
                    <span className="text-slate-500 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                    </span>
                    <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">
                      {log.type}
                    </span>
                    <span className={color}>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
