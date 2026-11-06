import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, ShieldAlert } from 'lucide-react';

interface PythonCodeModalProps {
  code: string;
  strategyName: string;
  symbol: string;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  code,
  strategyName,
  symbol,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `quantbot_${symbol.replace('/', '_').toLowerCase()}.py`;
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-slate-100">
                Production Python CCXT Bot Code
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ready-to-deploy Python script configured for {symbol} ({strategyName}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .py
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Safety Notice:</strong> Defaulted to <code>PAPER_TRADING = True</code>.
            Always test with simulated/testnet paper trading before enabling live exchange API credentials.
          </span>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 selection:bg-cyan-500/30">
          <pre className="p-4">{code}</pre>
        </div>

        {/* Footer with CLI instructions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Run:</span>
            <code className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
              pip install ccxt pandas && python quantbot.py
            </code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
