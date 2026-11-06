import React, { useMemo, useState, useRef } from 'react';
import { Candle, StrategyConfig, TradeRecord } from '../types/trading';
import { calculateBollingerBands, calculateMACD, calculateRSI, calculateSMA } from '../utils/indicators';

interface CandlestickChartProps {
  candles: Candle[];
  strategy: StrategyConfig;
  trades: TradeRecord[];
  currentPrice: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  strategy,
  trades,
  currentPrice,
}) => {
  const [subIndicator, setSubIndicator] = useState<'RSI' | 'MACD' | 'OFF'>('RSI');
  const [showSMA, setShowSMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport geometry
  const width = 850;
  const mainHeight = 330;
  const subHeight = subIndicator !== 'OFF' ? 100 : 0;
  const totalHeight = mainHeight + subHeight + 25; // 25 for time axis

  // Visible candles (last 65 candles for maximum clarity)
  const visibleCandles = useMemo(() => {
    return candles.slice(-65);
  }, [candles]);

  const closes = useMemo(() => visibleCandles.map((c) => c.close), [visibleCandles]);

  // Indicator Calculations
  const fastSMA = useMemo(
    () => calculateSMA(closes, strategy.fastPeriod),
    [closes, strategy.fastPeriod]
  );
  const slowSMA = useMemo(
    () => calculateSMA(closes, strategy.slowPeriod),
    [closes, strategy.slowPeriod]
  );
  const bollinger = useMemo(
    () => calculateBollingerBands(closes, strategy.bollingerPeriod, strategy.bollingerStdDev),
    [closes, strategy.bollingerPeriod, strategy.bollingerStdDev]
  );
  const rsi = useMemo(
    () => calculateRSI(closes, strategy.rsiPeriod),
    [closes, strategy.rsiPeriod]
  );
  const macd = useMemo(
    () => calculateMACD(closes, strategy.macdFast, strategy.macdSlow, strategy.macdSignal),
    [closes, strategy.macdFast, strategy.macdSlow, strategy.macdSignal]
  );

  // Price range scaling for main chart
  const { minPrice, maxPrice } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 1 };
    let min = Infinity;
    let max = -Infinity;
    for (const c of visibleCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    // Include bollinger bands in range if shown
    if (showBollinger) {
      for (const val of bollinger.upper) if (val && val > max) max = val;
      for (const val of bollinger.lower) if (val && val < min) min = val;
    }
    const padding = (max - min) * 0.08;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
    };
  }, [visibleCandles, showBollinger, bollinger]);

  const priceRange = maxPrice - minPrice || 1;

  // Chart coordinate converters
  const candleCount = visibleCandles.length;
  const chartPaddingLeft = 10;
  const chartPaddingRight = 65; // for price axis
  const usableWidth = width - chartPaddingLeft - chartPaddingRight;
  const stepX = usableWidth / Math.max(candleCount, 1);
  const candleWidth = Math.max(3, stepX * 0.68);

  const getY = (price: number) => {
    return mainHeight - ((price - minPrice) / priceRange) * (mainHeight - 30) - 15;
  };

  const getSubY_RSI = (val: number) => {
    // 0 to 100 range
    const top = mainHeight + 20;
    const bottom = mainHeight + subHeight - 10;
    return bottom - (val / 100) * (bottom - top);
  };

  // Build trade marker points for visible candles
  const visibleTrades = useMemo(() => {
    const minTime = visibleCandles[0]?.timestamp || 0;
    const maxTime = visibleCandles[visibleCandles.length - 1]?.timestamp || 0;
    return trades.filter((t) => t.entryTime >= minTime || t.exitTime <= maxTime);
  }, [trades, visibleCandles]);

  // Handle crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    if (mouseX >= chartPaddingLeft && mouseX <= width - chartPaddingRight) {
      const idx = Math.floor((mouseX - chartPaddingLeft) / stepX);
      if (idx >= 0 && idx < candleCount) {
        setHoverIndex(idx);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeCandle = hoverIndex !== null ? visibleCandles[hoverIndex] : visibleCandles[visibleCandles.length - 1];
  const activeFastSma = hoverIndex !== null ? fastSMA[hoverIndex] : fastSMA[fastSMA.length - 1];
  const activeSlowSma = hoverIndex !== null ? slowSMA[hoverIndex] : slowSMA[slowSMA.length - 1];
  const activeRsi = hoverIndex !== null ? rsi[hoverIndex] : rsi[rsi.length - 1];

  // Grid price lines (4 levels)
  const priceGridLevels = useMemo(() => {
    const levels = [];
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (priceRange * i) / 4;
      const y = getY(price);
      levels.push({ price, y });
    }
    return levels;
  }, [minPrice, priceRange]);

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm p-4 text-slate-200 shadow-xl">
      {/* Top Chart Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Left: Active OHLC Data Display */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {activeCandle && (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">O:</span>
                <span className="font-mono tabular-nums text-slate-100">${activeCandle.open.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">H:</span>
                <span className="font-mono tabular-nums text-emerald-400">${activeCandle.high.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">L:</span>
                <span className="font-mono tabular-nums text-rose-400">${activeCandle.low.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-400">C:</span>
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ${activeCandle.close.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Vol:</span>
                <span className="font-mono tabular-nums text-slate-300">{activeCandle.volume.toLocaleString()}</span>
              </div>
            </>
          )}

          {showSMA && activeFastSma && (
            <div className="flex items-center gap-1 text-cyan-400">
              <span className="inline-block w-2 h-0.5 bg-cyan-400"></span>
              <span>SMA {strategy.fastPeriod}:</span>
              <span className="font-mono tabular-nums">${activeFastSma.toFixed(2)}</span>
            </div>
          )}
          {showSMA && activeSlowSma && (
            <div className="flex items-center gap-1 text-amber-400">
              <span className="inline-block w-2 h-0.5 bg-amber-400"></span>
              <span>SMA {strategy.slowPeriod}:</span>
              <span className="font-mono tabular-nums">${activeSlowSma.toFixed(2)}</span>
            </div>
          )}
          {subIndicator === 'RSI' && activeRsi !== null && (
            <div className="flex items-center gap-1 text-purple-400">
              <span>RSI ({strategy.rsiPeriod}):</span>
              <span className="font-mono tabular-nums font-semibold">{activeRsi.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Right: Technical Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2.5 py-1 rounded transition-colors ${
                showSMA ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SMA {strategy.fastPeriod}/{strategy.slowPeriod}
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2.5 py-1 rounded transition-colors ${
                showBollinger ? 'bg-purple-500/20 text-purple-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bollinger
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setSubIndicator('RSI')}
              className={`px-2.5 py-1 rounded transition-colors ${
                subIndicator === 'RSI' ? 'bg-purple-500/20 text-purple-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RSI
            </button>
            <button
              onClick={() => setSubIndicator('MACD')}
              className={`px-2.5 py-1 rounded transition-colors ${
                subIndicator === 'MACD' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MACD
            </button>
            <button
              onClick={() => setSubIndicator('OFF')}
              className={`px-2 py-1 rounded transition-colors ${
                subIndicator === 'OFF' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Hide Sub
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden mt-2 select-none" ref={containerRef}>
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="bollingerFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="volumeGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="volumeRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Price Labels */}
          {priceGridLevels.map((lvl, i) => (
            <g key={i}>
              <line
                x1={chartPaddingLeft}
                y1={lvl.y}
                x2={width - chartPaddingRight}
                y2={lvl.y}
                stroke="#1e293b"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={width - chartPaddingRight + 6}
                y={lvl.y + 3}
                fill="#64748b"
                fontSize="10"
                fontFamily="var(--font-mono)"
                className="tabular-nums"
              >
                ${lvl.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Bollinger Bands Fill */}
          {showBollinger && (
            <g>
              {(() => {
                let upperPath = '';
                let lowerPath = '';
                for (let i = 0; i < candleCount; i++) {
                  const x = chartPaddingLeft + i * stepX + stepX / 2;
                  const u = bollinger.upper[i];
                  const l = bollinger.lower[i];
                  if (u !== null && l !== null) {
                    const yu = getY(u);
                    const yl = getY(l);
                    upperPath += (upperPath === '' ? 'M ' : ' L ') + `${x} ${yu}`;
                    lowerPath = ` L ${x} ${yl}` + lowerPath;
                  }
                }
                if (upperPath && lowerPath) {
                  return (
                    <path
                      d={upperPath + lowerPath + ' Z'}
                      fill="url(#bollingerFill)"
                    />
                  );
                }
                return null;
              })()}
            </g>
          )}

          {/* Volume Profile Bars (Bottom 18% of main chart) */}
          {visibleCandles.map((c, i) => {
            const x = chartPaddingLeft + i * stepX + (stepX - candleWidth) / 2;
            const maxVol = Math.max(...visibleCandles.map((vc) => vc.volume), 1);
            const barH = (c.volume / maxVol) * 45;
            const isBull = c.close >= c.open;
            return (
              <rect
                key={`vol-${i}`}
                x={x}
                y={mainHeight - barH}
                width={candleWidth}
                height={barH}
                fill={isBull ? 'url(#volumeGreen)' : 'url(#volumeRed)'}
              />
            );
          })}

          {/* Candlesticks Rendering */}
          {visibleCandles.map((c, i) => {
            const centerX = chartPaddingLeft + i * stepX + stepX / 2;
            const candleLeft = centerX - candleWidth / 2;
            const isBull = c.close >= c.open;
            const bodyColor = isBull ? '#10b981' : '#ef4444';

            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1.5);

            return (
              <g key={`candle-${i}`}>
                {/* Wick High-Low line */}
                <line
                  x1={centerX}
                  y1={yHigh}
                  x2={centerX}
                  y2={yLow}
                  stroke={bodyColor}
                  strokeWidth="1.2"
                />
                {/* Real Candle Body */}
                <rect
                  x={candleLeft}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={bodyColor}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Fast SMA Line */}
          {showSMA && (
            <path
              d={fastSMA.reduce((acc, val, i) => {
                if (val === null) return acc;
                const x = chartPaddingLeft + i * stepX + stepX / 2;
                const y = getY(val);
                return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
            />
          )}

          {/* Slow SMA Line */}
          {showSMA && (
            <path
              d={slowSMA.reduce((acc, val, i) => {
                if (val === null) return acc;
                const x = chartPaddingLeft + i * stepX + stepX / 2;
                const y = getY(val);
                return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.8"
            />
          )}

          {/* Bollinger Bands Lines */}
          {showBollinger && (
            <>
              <path
                d={bollinger.upper.reduce((acc, val, i) => {
                  if (val === null) return acc;
                  const x = chartPaddingLeft + i * stepX + stepX / 2;
                  return acc === '' ? `M ${x} ${getY(val)}` : `${acc} L ${x} ${getY(val)}`;
                }, '')}
                fill="none"
                stroke="#c084fc"
                strokeDasharray="2 2"
                strokeWidth="1.2"
              />
              <path
                d={bollinger.lower.reduce((acc, val, i) => {
                  if (val === null) return acc;
                  const x = chartPaddingLeft + i * stepX + stepX / 2;
                  return acc === '' ? `M ${x} ${getY(val)}` : `${acc} L ${x} ${getY(val)}`;
                }, '')}
                fill="none"
                stroke="#c084fc"
                strokeDasharray="2 2"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* Current Live Mark Price Line */}
          {(() => {
            const currentY = getY(currentPrice);
            return (
              <g>
                <line
                  x1={chartPaddingLeft}
                  y1={currentY}
                  x2={width - chartPaddingRight}
                  y2={currentY}
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                />
                <rect
                  x={width - chartPaddingRight + 1}
                  y={currentY - 10}
                  width={60}
                  height={20}
                  rx="3"
                  fill="#0284c7"
                />
                <text
                  x={width - chartPaddingRight + 31}
                  y={currentY + 4}
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  ${currentPrice.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* Historical Trade Execution Signals On Chart */}
          {visibleTrades.map((t) => {
            // Find closest candle index for trade entry
            const candleIdx = visibleCandles.findIndex(
              (c) => Math.abs(c.timestamp - t.entryTime) < 60 * 60 * 1000
            );
            if (candleIdx === -1) return null;
            const x = chartPaddingLeft + candleIdx * stepX + stepX / 2;
            const y = getY(t.entryPrice);
            return (
              <g key={t.id}>
                {/* Visual marker triangle */}
                <polygon
                  points={`${x},${y - 4} ${x - 5},${y + 7} ${x + 5},${y + 7}`}
                  fill="#10b981"
                />
                <circle cx={x} cy={y} r="2" fill="#ffffff" />
              </g>
            );
          })}

          {/* SUB-CHART INDICATOR (RSI or MACD) */}
          {subIndicator === 'RSI' && (
            <g transform={`translate(0, ${mainHeight + 10})`}>
              {/* Sub-divider */}
              <line
                x1={chartPaddingLeft}
                y1={0}
                x2={width - chartPaddingRight}
                y2={0}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* 70 Overbought and 30 Oversold reference lines */}
              <line
                x1={chartPaddingLeft}
                y1={25}
                x2={width - chartPaddingRight}
                y2={25}
                stroke="#ef4444"
                strokeDasharray="3 3"
                strokeWidth="0.8"
                strokeOpacity="0.6"
              />
              <text x={width - chartPaddingRight + 6} y={28} fill="#ef4444" fontSize="9" opacity="0.8">
                70
              </text>

              <line
                x1={chartPaddingLeft}
                y1={65}
                x2={width - chartPaddingRight}
                y2={65}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth="0.8"
                strokeOpacity="0.6"
              />
              <text x={width - chartPaddingRight + 6} y={68} fill="#10b981" fontSize="9" opacity="0.8">
                30
              </text>

              {/* RSI Curve */}
              <path
                d={rsi.reduce((acc, val, i) => {
                  if (val === null) return acc;
                  const x = chartPaddingLeft + i * stepX + stepX / 2;
                  // map 0..100 to y=85..5
                  const y = 85 - (val / 100) * 80;
                  return acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.8"
              />
            </g>
          )}

          {subIndicator === 'MACD' && (
            <g transform={`translate(0, ${mainHeight + 10})`}>
              <line
                x1={chartPaddingLeft}
                y1={0}
                x2={width - chartPaddingRight}
                y2={0}
                stroke="#334155"
                strokeWidth="1"
              />
              {/* Zero baseline */}
              <line
                x1={chartPaddingLeft}
                y1={45}
                x2={width - chartPaddingRight}
                y2={45}
                stroke="#475569"
                strokeWidth="1"
              />

              {/* Histogram bars */}
              {macd.histogram.map((h, i) => {
                if (h === null) return null;
                const x = chartPaddingLeft + i * stepX + (stepX - candleWidth) / 2;
                const hHeight = Math.min(Math.abs(h) * 0.4, 38);
                const isPos = h >= 0;
                const y = isPos ? 45 - hHeight : 45;
                return (
                  <rect
                    key={`hist-${i}`}
                    x={x}
                    y={y}
                    width={candleWidth}
                    height={Math.max(hHeight, 1)}
                    fill={isPos ? '#10b981' : '#ef4444'}
                    opacity="0.8"
                  />
                );
              })}
            </g>
          )}

          {/* Interactive Crosshair Lines */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line */}
              <line
                x1={chartPaddingLeft + hoverIndex * stepX + stepX / 2}
                y1={0}
                x2={chartPaddingLeft + hoverIndex * stepX + stepX / 2}
                y2={totalHeight}
                stroke="#94a3b8"
                strokeWidth="0.9"
                strokeDasharray="3 3"
              />
              {/* Horizontal line at hover price */}
              {activeCandle && (
                <line
                  x1={chartPaddingLeft}
                  y1={getY(activeCandle.close)}
                  x2={width - chartPaddingRight}
                  y2={getY(activeCandle.close)}
                  stroke="#94a3b8"
                  strokeWidth="0.9"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Chart Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span>Auto-Scaling Grid</span>
          <span aria-hidden="true">·</span>
          <span>Slippage & Maker Fee Model active</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>{visibleCandles.length} Bars Shown</span>
          <span aria-hidden="true">·</span>
          <span>Live Tick Engine Active</span>
        </div>
      </div>
    </div>
  );
};
