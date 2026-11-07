import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
} from 'recharts';
import { TradeRecord } from '../types/trading';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Award, ShieldAlert, Sliders, RefreshCw, Layers } from 'lucide-react';

interface EquityCurveLineChartProps {
  trades: TradeRecord[];
  initialCapital?: number;
  currentEquity?: number;
  onPopulateSampleSessions?: () => void;
}

interface ChartPoint {
  sessionNum: number;
  sessionLabel: string;
  equity: number;
  pnlUSD: number;
  pnlPercent: number;
  isWin: boolean | null;
  tradeId: string;
  side: string;
  reason: string;
  time: string;
  highWaterMark: number;
  drawdownPercent: number;
}

export const EquityCurveLineChart: React.FC<EquityCurveLineChartProps> = ({
  trades,
  initialCapital = 10000,
  currentEquity,
  onPopulateSampleSessions,
}) => {
  const [rangeMode, setRangeMode] = useState<'LAST_30' | 'ALL'>('LAST_30');
  const [showHighWaterMark, setShowHighWaterMark] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(true);

  // Filter to last 30 trade sessions or all
  const displayedTrades = useMemo(() => {
    if (rangeMode === 'LAST_30') {
      return trades.slice(-30);
    }
    return trades;
  }, [trades, rangeMode]);

  // Compute portfolio starting point for this window
  const windowStartingEquity = useMemo(() => {
    if (rangeMode === 'LAST_30' && trades.length > 30) {
      const priorTrades = trades.slice(0, trades.length - 30);
      const priorPnL = priorTrades.reduce((sum, t) => sum + t.realizedPnlUSD, 0);
      return initialCapital + priorPnL;
    }
    return initialCapital;
  }, [trades, rangeMode, initialCapital]);

  // Compute equity curve points
  const { chartData, metrics } = useMemo(() => {
    if (displayedTrades.length === 0) {
      const singlePoint: ChartPoint[] = [
        {
          sessionNum: 0,
          sessionLabel: 'S0',
          equity: initialCapital,
          pnlUSD: 0,
          pnlPercent: 0,
          isWin: null,
          tradeId: 'start',
          side: '-',
          reason: 'Initial Capital',
          time: 'Initial',
          highWaterMark: initialCapital,
          drawdownPercent: 0,
        },
      ];
      return {
        chartData: singlePoint,
        metrics: {
          startEquity: initialCapital,
          finalEquity: currentEquity || initialCapital,
          netPnLUSD: (currentEquity || initialCapital) - initialCapital,
          netPnLPercent: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
          peakEquity: initialCapital,
          maxDrawdownPercent: 0,
          profitFactor: 0,
        },
      };
    }

    let runningEquity = windowStartingEquity;
    let peakEquity = windowStartingEquity;
    let maxDrawdown = 0;
    let totalWinsUSD = 0;
    let totalLossesUSD = 0;
    let winCount = 0;
    let lossCount = 0;

    const points: ChartPoint[] = [
      {
        sessionNum: 0,
        sessionLabel: 'S0',
        equity: Number(runningEquity.toFixed(2)),
        pnlUSD: 0,
        pnlPercent: 0,
        isWin: null,
        tradeId: 'start',
        side: '-',
        reason: 'Window Start',
        time: 'Start',
        highWaterMark: Number(runningEquity.toFixed(2)),
        drawdownPercent: 0,
      },
    ];

    displayedTrades.forEach((trade, idx) => {
      runningEquity += trade.realizedPnlUSD;
      if (trade.realizedPnlUSD > 0) {
        winCount++;
        totalWinsUSD += trade.realizedPnlUSD;
      } else if (trade.realizedPnlUSD < 0) {
        lossCount++;
        totalLossesUSD += Math.abs(trade.realizedPnlUSD);
      }

      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }

      const drawdown = peakEquity > 0 ? ((runningEquity - peakEquity) / peakEquity) * 100 : 0;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }

      points.push({
        sessionNum: idx + 1,
        sessionLabel: `S${idx + 1}`,
        equity: Number(runningEquity.toFixed(2)),
        pnlUSD: trade.realizedPnlUSD,
        pnlPercent: trade.realizedPnlPercent,
        isWin: trade.realizedPnlUSD >= 0,
        tradeId: trade.id,
        side: trade.side,
        reason: trade.exitReason,
        time: new Date(trade.exitTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        highWaterMark: Number(peakEquity.toFixed(2)),
        drawdownPercent: Number(drawdown.toFixed(2)),
      });
    });

    const netPnLUSD = runningEquity - windowStartingEquity;
    const netPnLPercent = windowStartingEquity > 0 ? (netPnLUSD / windowStartingEquity) * 100 : 0;
    const totalTradesCount = winCount + lossCount;
    const winRate = totalTradesCount > 0 ? (winCount / totalTradesCount) * 100 : 0;
    const profitFactor = totalLossesUSD > 0 ? totalWinsUSD / totalLossesUSD : totalWinsUSD > 0 ? 99 : 0;

    return {
      chartData: points,
      metrics: {
        startEquity: windowStartingEquity,
        finalEquity: runningEquity,
        netPnLUSD,
        netPnLPercent,
        winCount,
        lossCount,
        winRate,
        peakEquity,
        maxDrawdownPercent: Math.abs(maxDrawdown),
        profitFactor,
      },
    };
  }, [displayedTrades, windowStartingEquity, initialCapital, currentEquity]);

  // Compute min/max for chart Y axis with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [initialCapital * 0.95, initialCapital * 1.05];
    const equities = chartData.map((d) => d.equity);
    const minVal = Math.min(...equities, windowStartingEquity);
    const maxVal = Math.max(...equities, windowStartingEquity);
    const span = maxVal - minVal || 100;
    const pad = span * 0.12;
    return [
      Math.floor((minVal - pad) / 10) * 10,
      Math.ceil((maxVal + pad) / 10) * 10,
    ];
  }, [chartData, windowStartingEquity, initialCapital]);

  const isNetPositive = metrics.netPnLUSD >= 0;
  const strokeColor = isNetPositive ? '#10b981' : '#f43f5e';

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 sm:p-4 text-slate-200 shadow-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Equity Curve</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/60 font-mono">
                  {rangeMode === 'LAST_30' ? 'Last 30 Sessions' : `All (${trades.length})`}
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cumulative portfolio capital progression across closed algorithmic trade sessions
            </p>
          </div>
        </div>

        {/* Action Buttons & Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {trades.length > 30 && (
            <div className="flex items-center rounded bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => setRangeMode('LAST_30')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  rangeMode === 'LAST_30'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Last 30
              </button>
              <button
                onClick={() => setRangeMode('ALL')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  rangeMode === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({trades.length})
              </button>
            </div>
          )}

          <button
            onClick={() => setShowBaseline((prev) => !prev)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              showBaseline
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Toggle baseline reference line"
          >
            Baseline
          </button>

          <button
            onClick={() => setShowHighWaterMark((prev) => !prev)}
            className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
              showHighWaterMark
                ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300'
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title="Toggle peak high-water mark line"
          >
            Peak HWM
          </button>

          {onPopulateSampleSessions && (
            <button
              onClick={onPopulateSampleSessions}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Load realistic 30-trade session history for visualization test"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Reset & Load 30 Sessions</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Session Window PnL</span>
          <div
            className={`text-sm font-bold font-mono tabular-nums flex items-center gap-1 mt-0.5 ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isNetPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>
              {isNetPositive ? '+' : ''}${metrics.netPnLUSD.toFixed(2)}
            </span>
            <span className="text-[10px] opacity-80">
              ({isNetPositive ? '+' : ''}{metrics.netPnLPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Current Equity</span>
          <div className="text-sm font-bold font-mono text-white tabular-nums mt-0.5">
            ${metrics.finalEquity.toFixed(2)}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Peak High-Water Mark</span>
          <div className="text-sm font-bold font-mono text-cyan-400 tabular-nums mt-0.5">
            ${metrics.peakEquity.toFixed(2)}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Win Rate</span>
          <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums mt-0.5 flex items-center gap-1.5">
            <span>{metrics.winRate.toFixed(1)}%</span>
            <span className="text-[10px] text-slate-400 font-normal">
              ({metrics.winCount}W / {metrics.lossCount}L)
            </span>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Max Drawdown</span>
          <div className="text-sm font-bold font-mono text-rose-400 tabular-nums mt-0.5">
            -{metrics.maxDrawdownPercent.toFixed(2)}%
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800/70">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Profit Factor</span>
          <div className="text-sm font-bold font-mono text-amber-300 tabular-nums mt-0.5">
            {metrics.profitFactor >= 99 ? '∞' : metrics.profitFactor.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-56 sm:h-64 pt-2">
        {chartData.length <= 1 && trades.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-400">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              Awaiting Closed Trade Sessions
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              As the autonomous bot executes buy and sell orders, your 30-session cumulative equity curve will plot here in real-time.
            </p>
            {onPopulateSampleSessions && (
              <button
                onClick={onPopulateSampleSessions}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Populate 30 Trade Sessions Now
              </button>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="sessionLabel"
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={{ stroke: '#334155' }}
                interval={displayedTrades.length > 20 ? 4 : 2}
              />

              <YAxis
                domain={yDomain}
                stroke="#475569"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={{ stroke: '#334155' }}
                tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
              />

              <Tooltip content={<CustomTooltip windowStartingEquity={windowStartingEquity} />} />

              {/* Baseline Reference Line */}
              {showBaseline && (
                <ReferenceLine
                  y={windowStartingEquity}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `Baseline ($${windowStartingEquity.toFixed(0)})`,
                    fill: '#94a3b8',
                    fontSize: 9,
                    position: 'insideTopLeft',
                  }}
                />
              )}

              {/* Peak High-Water Mark Line */}
              {showHighWaterMark && metrics.peakEquity > windowStartingEquity && (
                <ReferenceLine
                  y={metrics.peakEquity}
                  stroke="#06b6d4"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: `Peak: $${metrics.peakEquity.toFixed(0)}`,
                    fill: '#22d3ee',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Area under curve for visual depth */}
              <Area
                type="monotone"
                dataKey="equity"
                stroke="none"
                fill="url(#equityFill)"
                isAnimationActive={true}
              />

              {/* High Water Mark Trajectory */}
              {showHighWaterMark && (
                <Line
                  type="stepAfter"
                  dataKey="highWaterMark"
                  stroke="#0891b2"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  name="High Water Mark"
                  isAnimationActive={false}
                />
              )}

              {/* Main Equity Curve Line */}
              <Line
                type="monotone"
                dataKey="equity"
                stroke={strokeColor}
                strokeWidth={2.2}
                dot={<CustomDot />}
                activeDot={{
                  r: 5,
                  fill: '#ffffff',
                  stroke: strokeColor,
                  strokeWidth: 2,
                }}
                name="Portfolio Equity"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// Custom Dot marker on each session point
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || payload.sessionNum === 0) return null;

  const isWin = payload.isWin;
  const fill = isWin ? '#10b981' : '#f43f5e';

  return (
    <circle
      cx={cx}
      cy={cy}
      r={2.5}
      fill={fill}
      stroke="#0f172a"
      strokeWidth={1}
    />
  );
};

// Institutional Bloomberg-Style Dark Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  windowStartingEquity: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  windowStartingEquity,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data: ChartPoint = payload[0].payload;
  const isStart = data.sessionNum === 0;
  const netFromStart = data.equity - windowStartingEquity;
  const netFromStartPct = windowStartingEquity > 0 ? (netFromStart / windowStartingEquity) * 100 : 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md min-w-[210px] space-y-1.5 font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <span className="font-bold text-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          {isStart ? 'Starting Capital' : `Trade Session #${data.sessionNum}`}
        </span>
        <span className="font-mono text-[10px] text-slate-400">{data.time}</span>
      </div>

      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[11px]">Portfolio Equity:</span>
          <span className="font-mono font-bold text-white text-xs tabular-nums">
            ${data.equity.toFixed(2)}
          </span>
        </div>

        {!isStart && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Session Realized PnL:</span>
              <span
                className={`font-mono font-semibold tabular-nums ${
                  data.pnlUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.pnlUSD >= 0 ? '+' : ''}${data.pnlUSD.toFixed(2)} ({data.pnlUSD >= 0 ? '+' : ''}
                {data.pnlPercent.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Window Return:</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  netFromStart >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {netFromStart >= 0 ? '+' : ''}${netFromStart.toFixed(2)} ({netFromStart >= 0 ? '+' : ''}
                {netFromStartPct.toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1">
              <span>Trigger / Reason:</span>
              <span className="font-mono text-cyan-300 text-[10px]">{data.reason}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Drawdown from Peak:</span>
              <span className="font-mono text-rose-300 text-[10px] tabular-nums">
                {data.drawdownPercent.toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
