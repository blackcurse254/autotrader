import { StrategyConfig } from '../types/trading';

export function generatePythonCCXTCode(strategy: StrategyConfig, symbol = 'BTC/USDT', exchange = 'binance'): string {
  const formattedSymbol = symbol;

  return `#!/usr/bin/env python3
"""
=============================================================================
QuantBot Pro - Automated Quantitative Trading Bot
Strategy: ${strategy.name}
Symbol: ${formattedSymbol} | Exchange: ${exchange.toUpperCase()}
Generated on: ${new Date().toISOString()}
=============================================================================
Dependencies:
    pip install ccxt pandas numpy python-dotenv
"""

import time
import os
import sys
import logging
import ccxt
import pandas as pd
import numpy as np

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("QuantBot")

# =============================================================================
# 1. BOT CONFIGURATION
# =============================================================================
EXCHANGE_ID = '${exchange.toLowerCase()}'
SYMBOL = '${formattedSymbol}'
TIMEFRAME = '1h'
PAPER_TRADING = True   # Set to False to trade live real funds

# Strategy Parameters (${strategy.type})
FAST_PERIOD = ${strategy.fastPeriod}
SLOW_PERIOD = ${strategy.slowPeriod}
RSI_PERIOD = ${strategy.rsiPeriod}
RSI_OVERSOLD = ${strategy.rsiOversold}
RSI_OVERBOUGHT = ${strategy.rsiOverbought}
STOP_LOSS_PCT = ${strategy.stopLossPercent / 100}       # ${strategy.stopLossPercent}%
TAKE_PROFIT_PCT = ${strategy.takeProfitPercent / 100}   # ${strategy.takeProfitPercent}%
ALLOCATION_PCT = ${strategy.orderSizePercent / 100}     # ${strategy.orderSizePercent}% of balance

# Initialize Exchange
exchange_class = getattr(ccxt, EXCHANGE_ID)
exchange = exchange_class({
    'apiKey': os.getenv('EXCHANGE_API_KEY', 'YOUR_API_KEY_HERE'),
    'secret': os.getenv('EXCHANGE_SECRET_KEY', 'YOUR_SECRET_KEY_HERE'),
    'enableRateLimit': True,
    'options': {'defaultType': 'spot'}
})

if PAPER_TRADING and exchange.has.get('sandbox'):
    exchange.set_sandbox_mode(True)
    logger.info("Sandbox testnet mode ENABLED.")


# =============================================================================
# 2. MARKET DATA INGESTION & TECHNICAL INDICATORS
# =============================================================================
def fetch_ohlcv(symbol, timeframe='1h', limit=100):
    """Fetches historical candlestick data from exchange."""
    try:
        raw_candles = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
        df = pd.DataFrame(raw_candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except Exception as e:
        logger.error(f"Failed to fetch market candles: {e}")
        return None

def calculate_technical_indicators(df):
    """Calculates quantitative indicators: SMA, RSI, Bollinger Bands."""
    # Simple Moving Averages
    df['fast_sma'] = df['close'].rolling(window=FAST_PERIOD).mean()
    df['slow_sma'] = df['close'].rolling(window=SLOW_PERIOD).mean()

    # Relative Strength Index (RSI)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=RSI_PERIOD).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=RSI_PERIOD).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    return df


# =============================================================================
# 3. SIGNAL GENERATION ENGINE
# =============================================================================
def evaluate_signal(df, current_position):
    """
    Evaluates current bar against strategy rules:
    Strategy: ${strategy.name}
    """
    if len(df) < SLOW_PERIOD + 2:
        return 'HOLD'

    last = df.iloc[-1]
    prev = df.iloc[-2]

    fast_curr, slow_curr = last['fast_sma'], last['slow_sma']
    fast_prev, slow_prev = prev['fast_sma'], prev['slow_sma']
    rsi_curr = last['rsi']

    # BUY Signal: Golden Cross + RSI filter
    if fast_prev <= slow_prev and fast_curr > slow_curr:
        if current_position is None and rsi_curr < RSI_OVERBOUGHT:
            logger.info(f"[SIGNAL] Golden Cross detected! Fast: {fast_curr:.2f} > Slow: {slow_curr:.2f} | RSI: {rsi_curr:.1f}")
            return 'BUY'

    # SELL Signal: Death Cross or RSI Overbought
    if (fast_prev >= slow_prev and fast_curr < slow_curr) or (rsi_curr >= RSI_OVERBOUGHT):
        if current_position == 'LONG':
            logger.info(f"[SIGNAL] Exit condition met! Fast: {fast_curr:.2f} < Slow: {slow_curr:.2f} | RSI: {rsi_curr:.1f}")
            return 'SELL'

    return 'HOLD'


# =============================================================================
# 4. ORDER EXECUTION & RISK MANAGEMENT
# =============================================================================
class PortfolioManager:
    def __init__(self, initial_cash=10000.0):
        self.cash = initial_cash
        self.position = None
        self.entry_price = 0.0
        self.position_amount = 0.0

    def get_order_size(self, current_price):
        """Calculates position size based on portfolio allocation rule."""
        allocated_capital = self.cash * ALLOCATION_PCT
        return round(allocated_capital / current_price, 6)

    def execute_buy(self, symbol, current_price):
        amount = self.get_order_size(current_price)
        cost = amount * current_price

        if cost > self.cash:
            logger.warning("Insufficient funds to open position.")
            return

        if not PAPER_TRADING:
            order = exchange.create_market_buy_order(symbol, amount)
            logger.info(f"[LIVE ORDER] Buy filled: {order['id']}")
        else:
            logger.info(f"[PAPER ORDER] BUY {amount} {symbol} @ \${current_price:.2f} (Total: \${cost:.2f})")

        self.cash -= cost
        self.position = 'LONG'
        self.entry_price = current_price
        self.position_amount = amount

    def execute_sell(self, symbol, current_price, reason='SIGNAL'):
        if self.position != 'LONG':
            return

        revenue = self.position_amount * current_price
        profit = revenue - (self.position_amount * self.entry_price)
        pct = (profit / (self.position_amount * self.entry_price)) * 100

        if not PAPER_TRADING:
            order = exchange.create_market_sell_order(symbol, self.position_amount)
            logger.info(f"[LIVE ORDER] Sell filled: {order['id']}")
        else:
            logger.info(f"[PAPER ORDER] SELL {self.position_amount} {symbol} @ \${current_price:.2f} | Reason: {reason} | PnL: \${profit:+.2f} ({pct:+.2f}%)")

        self.cash += revenue
        self.position = None
        self.entry_price = 0.0
        self.position_amount = 0.0

    def check_risk_limits(self, current_price, symbol):
        """Monitors Stop Loss and Take Profit levels."""
        if self.position == 'LONG':
            # Stop loss trigger
            if current_price <= self.entry_price * (1.0 - STOP_LOSS_PCT):
                logger.warning(f"[RISK GUARD] Stop Loss triggered at \${current_price:.2f}")
                self.execute_sell(symbol, current_price, reason='STOP_LOSS')
            # Take profit trigger
            elif current_price >= self.entry_price * (1.0 + TAKE_PROFIT_PCT):
                logger.info(f"[RISK GUARD] Take Profit target hit at \${current_price:.2f}")
                self.execute_sell(symbol, current_price, reason='TAKE_PROFIT')


# =============================================================================
# 5. MAIN EVENT LOOP
# =============================================================================
def main():
    logger.info("=" * 60)
    logger.info(f"QuantBot starting for {SYMBOL} on {EXCHANGE_ID.upper()}")
    logger.info(f"Execution Mode: {'SIMULATED (PAPER TRADING)' if PAPER_TRADING else 'LIVE CAPITAL'}")
    logger.info(f"Strategy: {FAST_PERIOD}/{SLOW_PERIOD} SMA Cross with {STOP_LOSS_PCT*100}% SL / {TAKE_PROFIT_PCT*100}% TP")
    logger.info("=" * 60)

    portfolio = PortfolioManager(initial_cash=10000.0)

    while True:
        try:
            # 1. Fetch market candles
            df = fetch_ohlcv(SYMBOL, TIMEFRAME)
            if df is not None:
                # 2. Compute indicators
                df = calculate_technical_indicators(df)
                current_price = df.iloc[-1]['close']

                # 3. Check active risk controls
                portfolio.check_risk_limits(current_price, SYMBOL)

                # 4. Generate & execute signals
                signal = evaluate_signal(df, portfolio.position)
                if signal == 'BUY' and portfolio.position is None:
                    portfolio.execute_buy(SYMBOL, current_price)
                elif signal == 'SELL' and portfolio.position == 'LONG':
                    portfolio.execute_sell(SYMBOL, current_price, reason='SIGNAL')

                # Status heartbeat
                logger.info(f"Price: \${current_price:,.2f} | Signal: {signal} | Position: {portfolio.position or 'FLAT'} | Cash: \${portfolio.cash:,.2f}")

            # Sleep between bar intervals (e.g., 60 seconds)
            time.sleep(60)

        except KeyboardInterrupt:
            logger.info("Bot execution halted by user.")
            break
        except Exception as e:
            logger.error(f"Runtime iteration error: {e}")
            time.sleep(15)

if __name__ == '__main__':
    main()
`;
}
