import React, { useState } from 'react';
import { OrderBook } from '../types/trading';
import { Layers, ArrowUp, ArrowDown } from 'lucide-react';

interface OrderBookWidgetProps {
  orderBook: OrderBook;
  symbol: string;
  onPlaceManualOrder: (side: 'BUY' | 'SELL', price: number, amountPct: number) => void;
}

export const OrderBookWidget: React.FC<OrderBookWidgetProps> = ({
  orderBook,
  symbol,
  onPlaceManualOrder,
}) => {
  const [manualAlloc, setManualAlloc] = useState(25); // % of equity

  const totalBidVol = orderBook.bids.reduce((acc, b) => acc + b.amount, 0);
  const totalAskVol = orderBook.asks.reduce((acc, a) => acc + a.amount, 0);
  const buyRatio = totalBidVol + totalAskVol > 0 ? (totalBidVol / (totalBidVol + totalAskVol)) * 100 : 50;

  const maxTotal = Math.max(
    orderBook.bids[orderBook.bids.length - 1]?.total || 1,
    orderBook.asks[orderBook.asks.length - 1]?.total || 1
  );

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-sm p-4 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Order Book Depth (L2)</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span>Spread:</span>
          <span className="text-slate-200 tabular-nums font-semibold">${orderBook.spread.toFixed(2)}</span>
          <span className="text-slate-500">({orderBook.spreadPercent.toFixed(3)}%)</span>
        </div>
      </div>

      {/* Book Tables */}
      <div className="flex flex-col gap-2 pt-2 text-xs">
        {/* Asks (Sells) Table - descending */}
        <div className="flex flex-col space-y-0.5">
          <div className="grid grid-cols-3 text-[10px] text-slate-500 font-medium pb-1 border-b border-slate-800/60">
            <span>Price (USDT)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {orderBook.asks.slice(0, 5).reverse().map((ask, i) => {
            const depthPct = Math.min((ask.total / maxTotal) * 100, 100);
            return (
              <div
                key={`ask-${i}`}
                className="relative grid grid-cols-3 py-0.5 font-mono tabular-nums text-[11px] hover:bg-slate-800/40 transition-colors"
              >
                {/* Red depth bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="text-rose-400 font-semibold">${ask.price.toFixed(2)}</span>
                <span className="text-right text-slate-300">{ask.amount.toFixed(3)}</span>
                <span className="text-right text-slate-500">{ask.total.toFixed(3)}</span>
              </div>
            );
          })}
        </div>

        {/* Mid-Market Price Strip */}
        <div className="flex items-center justify-between py-1 px-2 my-1 rounded bg-slate-950/80 border border-slate-800 font-mono">
          <span className="text-xs text-slate-400">Mark Price:</span>
          <span className="text-sm font-bold text-slate-100 tabular-nums">
            ${orderBook.lastPrice.toFixed(2)}
          </span>
        </div>

        {/* Bids (Buys) Table */}
        <div className="flex flex-col space-y-0.5">
          {orderBook.bids.slice(0, 5).map((bid, i) => {
            const depthPct = Math.min((bid.total / maxTotal) * 100, 100);
            return (
              <div
                key={`bid-${i}`}
                className="relative grid grid-cols-3 py-0.5 font-mono tabular-nums text-[11px] hover:bg-slate-800/40 transition-colors"
              >
                {/* Green depth bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none"
                  style={{ width: `${depthPct}%` }}
                />
                <span className="text-emerald-400 font-semibold">${bid.price.toFixed(2)}</span>
                <span className="text-right text-slate-300">{bid.amount.toFixed(3)}</span>
                <span className="text-right text-slate-500">{bid.total.toFixed(3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market Pressure Gauge */}
      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-800 text-[11px]">
        <div className="flex justify-between text-slate-400">
          <span className="text-emerald-400 font-mono font-medium">Bids {buyRatio.toFixed(0)}%</span>
          <span className="text-slate-500">Book Pressure</span>
          <span className="text-rose-400 font-mono font-medium">Asks {(100 - buyRatio).toFixed(0)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${buyRatio}%` }} />
          <div className="bg-rose-500 transition-all duration-300" style={{ width: `${100 - buyRatio}%` }} />
        </div>
      </div>

      {/* Manual Bot Intervention / Quick Order Pad */}
      <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Manual Bot Override</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlaceManualOrder('BUY', orderBook.lastPrice, manualAlloc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Buy Market
          </button>
          <button
            onClick={() => onPlaceManualOrder('SELL', orderBook.lastPrice, manualAlloc)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Sell Market
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Allocation:</span>
          <div className="flex items-center gap-1">
            {[10, 25, 50, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setManualAlloc(pct)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  manualAlloc === pct ? 'bg-slate-700 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
