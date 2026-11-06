import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: AI Strategy Generator & Quant Optimizer
app.post('/api/gemini/generate-strategy', async (req, res) => {
  try {
    const { prompt, market, timeframe, riskTolerance } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'No GEMINI_API_KEY configured in environment.',
      });
    }

    const systemPrompt = `You are a Principal Quantitative Trader and Python Algorithmic Engineer specializing in CCXT, Backtrader, and high-frequency crypto trading algorithms.
The user wants to generate or refine an automated trading bot strategy.
Respond in valid JSON only with NO markdown code fences or backticks. Format:
{
  "strategyName": "Short descriptive name",
  "summary": "1-2 sentence high-level explanation of the edge and math",
  "indicators": ["List of indicators used, e.g. SMA(9), SMA(21), RSI(14)"],
  "entryRules": "Clear bullet points for entering LONG / SHORT",
  "exitRules": "Clear bullet points for Take Profit / Stop Loss / Trailing Stop",
  "recommendedRiskReward": "e.g. 1:2.5 (Stop Loss 1.5%, Take Profit 3.75%)",
  "timeframe": "${timeframe || '1h'}",
  "pythonCode": "Complete, production-ready Python 3 code using ccxt and pandas with paper trading mode, signal logic, position tracking, and risk management."
}`;

    const userPrompt = `Create an automated trading bot strategy for ${market || 'BTC/USDT'} on ${timeframe || '1h'} timeframe with ${riskTolerance || 'moderate'} risk tolerance.
User requirement: ${prompt || 'Dual Moving Average Crossover with RSI filter and dynamic ATR Stop Loss'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // In case of slight formatting variation
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    res.json({ success: true, strategy: data });
  } catch (error: any) {
    console.error('Error generating strategy via Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate strategy with Gemini',
    });
  }
});

// API Route: AI Market Sentiment & Technical Analysis
app.post('/api/gemini/analyze-market', async (req, res) => {
  try {
    const { symbol, currentPrice, high24h, low24h, volume24h, recentCandlesSummary } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'No GEMINI_API_KEY configured.',
      });
    }

    const prompt = `Perform a quantitative technical assessment of ${symbol}:
- Current Price: $${currentPrice}
- 24h High: $${high24h} | 24h Low: $${low24h}
- 24h Volume: ${volume24h}
- Recent Action: ${recentCandlesSummary || 'Consolidating near key moving average support'}

Provide a JSON response with:
{
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidenceScore": number (1-100),
  "keySupport": number,
  "keyResistance": number,
  "volatilityRegime": "LOW" | "NORMAL" | "HIGH" | "EXTREME",
  "recommendedAction": "e.g. Look for dip buy near support or trail stop",
  "rationale": "2-3 concise sentences on order flow, momentum, and key levels"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: data });
  } catch (error: any) {
    console.error('Market analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real market ticker proxy (Binance public API with fallback)
app.get('/api/market/ticker', async (req, res) => {
  try {
    const symbol = ((req.query.symbol as string) || 'BTCUSDT').toUpperCase().replace('/', '');
    const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (binanceRes.ok) {
      const data = await binanceRes.json();
      return res.json({
        success: true,
        symbol: req.query.symbol || 'BTC/USDT',
        lastPrice: parseFloat(data.lastPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        priceChangePercent: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
      });
    }
    throw new Error('Binance response not ok');
  } catch {
    // Return simulated or safe defaults
    res.json({
      success: false,
      fallback: true,
    });
  }
});

// API Route: Export Docker Config Bundle
app.get('/api/docker/config-bundle', (_req, res) => {
  try {
    const readFileSafe = (filename: string) => {
      const p = path.join(__dirname, filename);
      return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
    };

    res.json({
      success: true,
      files: {
        'docker-compose.yml': readFileSafe('docker-compose.yml'),
        'Dockerfile': readFileSafe('Dockerfile'),
        'Dockerfile.bot': readFileSafe('Dockerfile.bot'),
        'requirements.txt': readFileSafe('requirements.txt'),
        'quantbot.py': readFileSafe('quantbot.py'),
        'setup-docker.sh': readFileSafe('setup-docker.sh'),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QuantBot Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
