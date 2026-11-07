import React, { useState } from 'react';
import { X, BookOpen, Terminal, ShieldAlert, Cpu, TrendingUp, CheckCircle, Copy, Check, Container, Download, Smartphone } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [lang, setLang] = useState<'FA' | 'EN'>('FA');
  const [activeTab, setActiveTab] = useState<'MOBILE' | 'DOCKER' | 'GENERAL' | 'PYTHON'>('MOBILE');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dockerComposeCmd = `docker compose up -d --build`;
  const dockerBuildCmd = `docker build -t quantbot-pro .\ndocker run -d -p 3000:3000 --name quantbot-web --restart unless-stopped quantbot-pro`;
  const dockerLogsBotCmd = `docker logs -f quantbot-bot`;
  const dockerLogsWebCmd = `docker logs -f quantbot-web`;
  const pipSnippet = `pip install ccxt pandas numpy python-dotenv`;

  const botDockerfileContent = `FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY quantbot.py ./

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD pgrep -f quantbot.py > /dev/null || exit 1

CMD ["python", "-u", "quantbot.py"]
`;

  const composeYamlContent = `services:
  quantbot-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: quantbot-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    volumes:
      - trade-data:/app/data

  quantbot-bot:
    build:
      context: .
      dockerfile: Dockerfile.bot
    container_name: quantbot-bot
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pgrep -f quantbot.py > /dev/null || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    environment:
      - EXCHANGE_ID=binance
      - SYMBOL=BTC/USDT
      - PAPER_TRADING=True
      - PYTHONUNBUFFERED=1
    volumes:
      - trade-data:/app/data
      - ./quantbot.py:/app/quantbot.py:ro

volumes:
  trade-data:
    name: quantbot-trade-data
`;

  const requirementsTxtContent = `ccxt>=4.2.0
pandas>=2.2.0
numpy>=1.26.0
python-dotenv>=1.0.0
`;

  const downloadAllDockerBundle = () => {
    downloadFile('Dockerfile.bot', botDockerfileContent);
    setTimeout(() => downloadFile('docker-compose.yml', composeYamlContent), 250);
    setTimeout(() => downloadFile('requirements.txt', requirementsTxtContent), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {lang === 'FA' ? 'راهنمای کاربری و نصب QuantBot Pro' : 'QuantBot Pro User & Deployment Guide'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'FA'
                  ? 'دستورالعمل کامل نصب با Docker، شبیه‌ساز معاملات و اجرای اسکریپت پایتون'
                  : 'Complete instructions for Docker deployment, web simulation & Python CCXT execution'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-lg bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang('FA')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'FA' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                فارسی
              </button>
              <button
                onClick={() => setLang('EN')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  lang === 'EN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 px-6 pt-3 border-b border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('MOBILE')}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'MOBILE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? 'آنلاین‌سازی و کنترل از گوشی' : 'Cloud & Mobile Access'}</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCKER')}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'DOCKER'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Container className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? 'نصب و اجرای Docker' : 'Docker Deployment'}</span>
          </button>

          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'GENERAL'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? 'راهنمای پلتفرم و استراتژی‌ها' : 'Platform & Strategies'}</span>
          </button>

          <button
            onClick={() => setActiveTab('PYTHON')}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'PYTHON'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{lang === 'FA' ? 'اجرای پایتون (CCXT)' : 'Python Script Setup'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB: MOBILE & CLOUD ACCESS */}
          {activeTab === 'MOBILE' && (
            <div className={lang === 'FA' ? 'space-y-5 text-right leading-relaxed' : 'space-y-5 text-left leading-relaxed'} dir={lang === 'FA' ? 'rtl' : 'ltr'}>
              {/* ۱. لینک آنلاین ابری فعال همین لحظه */}
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>{lang === 'FA' ? 'روش ۱: استفاده مستقیم از لینک ابری آنلاین (همین الان فعال است!)' : 'Method 1: Direct Cloud Web Access (Live Right Now!)'}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">
                    Cloud Run 24/7
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'این برنامه همین الان روی سرورهای ابری گوگل با آدرس اختصاصی آنلاین است و نیازی نیست کامپیوتر یا لپ‌تاپ شما روشن بماند. کافیست آدرس زیر را در مرورگر گوشی (سافاری یا کروم) باز کنید:'
                    : 'This application is already hosted 24/7 on Google Cloud. You can open it directly in your mobile browser without keeping your computer on:'}
                </p>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs ltr" dir="ltr">
                  <code className="truncate">{window.location.origin}</code>
                  <button
                    onClick={() => copyToClipboard(window.location.origin, 'cloudUrl')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copiedKey === 'cloudUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'FA'
                    ? '💡 نکته: در مرورگر آیفون یا اندروید، دکمه Share و سپس "Add to Home Screen" را بزنید تا برنامه مثل یک اپلیکیشن بومی روی صفحه اصلی گوشی شما نصب شود.'
                    : 'Tip: Tap Share and select "Add to Home Screen" on your mobile device to install it as a standalone app.'}
                </p>
              </div>

              {/* ۲. اجرای ۲۴ ساعته کانتینر داکر روی سرور ابری ارزان */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
                  <span>{lang === 'FA' ? 'روش ۲: میزبانی ۲۴ ساعته Docker روی سرور مجازی ارزان (VPS)' : 'Method 2: 24/7 Docker Hosting on a cheap Cloud VPS'}</span>
                  <span className="text-[11px] text-amber-400 font-mono">100% مستقل</span>
                </h3>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'یک سرور مجازی لینوکسی (VPS) از شرکت‌های خارجی (مثل Hetzner ،DigitalOcean) یا شرکت‌های داخلی (ماهانه حدود ۱۰۰ تا ۲۰۰ هزار تومان) تهیه کنید. سپس تنها یک‌بار دستور زیر را در سرور اجرا نمایید:'
                    : 'Deploy on a cheap Linux VPS (Hetzner, DigitalOcean, or Render) with a single command:'}
                </p>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs ltr" dir="ltr">
                  <code>git clone &lt;repo&gt; &amp;&amp; cd algotrade &amp;&amp; docker compose up -d</code>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'FA'
                    ? 'ربات شبانه‌روزی در اینترنت فعال خواهد بود؛ حتی اگر گوشیتان خاموش شود یا اینترنت قطع شود.'
                    : 'The bot will run continuously in the cloud even if your phone goes offline or battery drains.'}
                </p>
              </div>

              {/* ۳. دریافت پیام و نوتیفیکیشن هر ترید در تلگرام گوشی */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span>{lang === 'FA' ? 'روش ۳: نوتیفیکیشن لحظه‌ای معاملات روی تلگرام گوشی' : 'Method 3: Instant Trade Push Alerts on Telegram'}</span>
                </h3>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'در اسکریپت quantbot.py قابلیت نوتیفیکیشن تلگرام تعبیه شده است. کافیست در docker-compose یا فایل محیطی این دو متغیر را ست کنید تا به محض هر خرید یا فروش، یک پیام به تلگرام گوشی شما ارسال شود:'
                    : 'quantbot.py natively supports instant Telegram push alerts. Simply set your bot token and chat ID:'}
                </p>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-purple-300 ltr" dir="ltr">
                  TELEGRAM_BOT_TOKEN="توکن_ربات_تلگرام_شما"<br />
                  TELEGRAM_CHAT_ID="شناسه_عددی_اکانت_شما"
                </div>
              </div>

              {/* ۴. مدیریت سرور از راه دور با گوشی */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-200">
                  {lang === 'FA' ? 'روش ۴: اپلیکیشن‌های رایگان موبایل برای کنترل سرور (SSH)' : 'Method 4: Mobile SSH Apps for Live Control'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-cyan-300 block mb-0.5">اپلیکیشن Termius (آیفون و اندروید):</strong>
                    {lang === 'FA' ? 'بهترین اپلیکیشن برای اتصال به سرور از گوشی، دیدن لاگ‌های ترید و توقف یا راه‌اندازی ربات.' : 'Top-rated SSH client for iOS & Android to view live logs and restart containers on the go.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-300 block mb-0.5">اپلیکیشن Termux (اندروید):</strong>
                    {lang === 'FA' ? 'امکان اجرای مستقیم کد پایتون ربات روی خود گوشی اندروید بدون نیاز به کامپیوتر.' : 'Run Python scripts directly on your Android phone without needing a computer.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DOCKER */}
          {activeTab === 'DOCKER' && (
            <div className={lang === 'FA' ? 'space-y-5 text-right leading-relaxed' : 'space-y-5 text-left leading-relaxed'} dir={lang === 'FA' ? 'rtl' : 'ltr'}>
              <div className="p-4 rounded-lg bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Container className="w-4 h-4 shrink-0" />
                  <span>{lang === 'FA' ? 'پروژه به طور کامل برای Docker آماده‌سازی شد!' : 'Project is fully prepared for Docker!'}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'فایل‌های Dockerfile ،docker-compose.yml ،.dockerignore و Dockerfile.bot با ساختار Multi-stage استاندارد و سبک‌وزن برای محیط پروداکشن به پروژه اضافه شدند.'
                    : 'Standard multi-stage production Dockerfile, docker-compose.yml, .dockerignore, and Dockerfile.bot have been generated.'}
                </p>
              </div>

              {/* روش ۱: اجرای یکپارچه با Docker Compose */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">
                    {lang === 'FA' ? '۱. راه‌اندازی فول‌استک با یک دستور (داشبورد + ربات خودکار)' : '1. Full-Stack 1-Click Launch (Web Dashboard + Autonomous Bot)'}
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                    {lang === 'FA' ? 'پیشنهادی' : 'Recommended'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'با اجرای این دستور، هر دو کانتینر (وب‌ترمینال روی پورت ۳۰۰۰ و ربات معاملاتی خودکار در پس‌زمینه) به طور همزمان اجرا می‌شوند:'
                    : 'Running this command starts both containers simultaneously (Web Terminal on port 3000 and the Autonomous Bot in background):'}
                </p>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs ltr" dir="ltr">
                  <code>{dockerComposeCmd}</code>
                  <button
                    onClick={() => copyToClipboard(dockerComposeCmd, 'compose')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedKey === 'compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {lang === 'FA' ? 'آدرس داشبورد وب:' : 'Web Dashboard URL:'}{' '}
                      <code className="text-emerald-400 font-mono">http://localhost:3000</code>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={downloadAllDockerBundle}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] shadow-sm transition-colors"
                      title="Download all required Docker files"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'FA' ? 'دانلود یکجای بسته Docker' : 'Download All Docker Files'}</span>
                    </button>
                    <button
                      onClick={() => downloadFile('Dockerfile.bot', botDockerfileContent)}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                    >
                      <Download className="w-3 h-3" />
                      Dockerfile.bot
                    </button>
                    <button
                      onClick={() => downloadFile('docker-compose.yml', composeYamlContent)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                    >
                      <Download className="w-3 h-3" />
                      docker-compose.yml
                    </button>
                    <button
                      onClick={() => downloadFile('requirements.txt', requirementsTxtContent)}
                      className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                    >
                      <Download className="w-3 h-3" />
                      requirements.txt
                    </button>
                  </div>
                </div>
              </div>

              {/* چرخه عملکرد ترید خودکار ربات */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {lang === 'FA' ? '۲. چرخه ترید تمام خودکار ربات (Round-Trip Lifecycle)' : '2. Autonomous Round-Trip Lifecycle'}
                </h3>
                <p className="text-xs text-slate-300">
                  {lang === 'FA'
                    ? 'ربات پس از بالا آمدن در داکر به صورت کاملاً مستقل و بی‌وقفه مراحل زیر را طی می‌کند:'
                    : 'The bot executes the following cycle autonomously 24/7 without stalling:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-300 block mb-0.5">۱. رصد و ورود خودکار (Auto Entry):</strong>
                    {lang === 'FA' ? 'پایش لحظه‌ای کندل‌ها و صدور اوردر خرید در زمان کراس طلایی یا برگشت RSI.' : 'Monitors live feed and places BUY order upon Golden Cross or oversold bounce.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-cyan-300 block mb-0.5">۲. مدیریت فعال پوزیشن (Risk Guards):</strong>
                    {lang === 'FA' ? 'محاسبه لحظه‌ای سود/زیان و اعمال حد ضرر ۲٪، حد سود ۵٪ و تریلینگ استاپ.' : 'Real-time PnL tracking with 2% Stop Loss, 5% Take Profit, and trailing stops.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-amber-300 block mb-0.5">۳. خروج و بستن معامله (Auto Exit):</strong>
                    {lang === 'FA' ? 'تکمیل خودکار معامله با فعال شدن حد سود یا حد ضرر و ذخیره سود در تراز حساب.' : 'Auto-closes position when targets are hit, recording profit into capital.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-purple-300 block mb-0.5">۴. تکرار چرخه بعدی (Continuous Loop):</strong>
                    {lang === 'FA' ? 'بلافاصله پس از بسته شدن معامله، ربات وارد جستجو برای ستاپ معامله بعدی می‌شود.' : 'Immediately resumes scanning for the next profitable setup.'}
                  </div>
                </div>
              </div>

              {/* مشاهده لاگ‌های زنده ربات */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">
                    {lang === 'FA' ? '۳. مشاهده لاگ‌های زنده و سیگنال‌های ربات' : '3. Monitoring Live Bot Logs & Signals'}
                  </h3>
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs ltr" dir="ltr">
                  <code>{dockerLogsBotCmd}</code>
                  <button
                    onClick={() => copyToClipboard(dockerLogsBotCmd, 'botLogs')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy command"
                  >
                    {copiedKey === 'botLogs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'FA'
                    ? 'برای دیدن لاگ‌های سرور وب ترمینال: docker logs -f quantbot-web'
                    : 'To inspect web terminal container logs: docker logs -f quantbot-web'}
                </p>
              </div>
            </div>
          )}

          {/* TAB: GENERAL */}
          {activeTab === 'GENERAL' && (
            <div className={lang === 'FA' ? 'space-y-6 text-right leading-relaxed' : 'space-y-6 text-left leading-relaxed'} dir={lang === 'FA' ? 'rtl' : 'ltr'}>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  {lang === 'FA' ? 'بخش‌های اصلی پلتفرم وب (شبیه‌ساز تریدینگ)' : 'Core Web Simulator Features'}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-xs text-slate-300 pr-1">
                  <li>
                    <strong className="text-white">{lang === 'FA' ? 'نوار کنترل بات:' : 'Bot Controls:'}</strong>{' '}
                    {lang === 'FA'
                      ? 'با دکمه Start Bot یا Pause Bot می‌توانید الگوریتم را فعال یا متوقف کنید.'
                      : 'Toggle automated execution with Start / Pause Bot.'}
                  </li>
                  <li>
                    <strong className="text-white">{lang === 'FA' ? 'نمودار تعاملی کندل‌استیک:' : 'Candlestick Chart:'}</strong>{' '}
                    {lang === 'FA'
                      ? 'نمودار زنده قیمت با میانگین متحرک SMA، باند بولینگر و پنل زیرین RSI و MACD.'
                      : 'Real-time candlestick chart with SMA, Bollinger Bands, and RSI / MACD sub-panels.'}
                  </li>
                  <li>
                    <strong className="text-white">{lang === 'FA' ? 'دفتر معاملات و نمودار منحنی سرمایه (Equity Curve):' : 'Trade Ledger & Equity Curve:'}</strong>{' '}
                    {lang === 'FA'
                      ? 'رسم خودکار منحنی تغییرات سرمایه (Equity) در ۳۰ نشست معاملاتی اخیر با Recharts، خط مرجع پایه، سقف تاریخی سرمایه (High-Water Mark) و ریزمعاملات.'
                      : 'Interactive Recharts line chart tracking cumulative portfolio equity across the last 30 trade sessions with high-water marks and drawdown metrics.'}
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  {lang === 'FA' ? 'استراتژی‌ها و مدیریت ریسک' : 'Strategies & Risk Management'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-300">SMA Cross:</strong> {lang === 'FA' ? 'کراس طلایی مووینگ‌های ۹ و ۲۱ برای صعود.' : 'Golden cross of 9 and 21 moving averages.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-purple-300">RSI Reversion:</strong> {lang === 'FA' ? 'خرید در اشباع فروش زیر ۳۰ و خروج در بالای ۷۰.' : 'Buy oversold (<30), exit overbought (>70).'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-cyan-300">Bollinger Breakout:</strong> {lang === 'FA' ? 'ورود با واکنش به باند پایینی و خروج در باند بالایی.' : 'Bounce off lower 2-sigma band, take profit at upper band.'}
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <strong className="text-amber-300">Grid Scalper:</strong> {lang === 'FA' ? 'نوسان‌گیری با اوردرهای پلکانی در بازار خنثی.' : 'Automated stepped grid oscillation for sideways markets.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PYTHON */}
          {activeTab === 'PYTHON' && (
            <div className={lang === 'FA' ? 'space-y-5 text-right leading-relaxed' : 'space-y-5 text-left leading-relaxed'} dir={lang === 'FA' ? 'rtl' : 'ltr'}>
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                  {lang === 'FA' ? 'نصب و اجرای ربات در پایتون (Python CCXT)' : 'Running the Python CCXT Bot'}
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-xs text-slate-300 pr-1">
                  <li>
                    {lang === 'FA' ? 'نصب پکیج‌ها:' : 'Install packages:'}
                    <div className="flex items-center justify-between gap-2 p-2 mt-1 rounded bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs ltr" dir="ltr">
                      <code>{pipSnippet}</code>
                      <button
                        onClick={() => copyToClipboard(pipSnippet, 'pip')}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                      >
                        {copiedKey === 'pip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                  <li>
                    {lang === 'FA'
                      ? 'دانلود کد: روی دکمه Python CCXT Code در استودیو استراتژی کلیک کرده و فایل quantbot.py را دریافت کنید.'
                      : 'Download code: Click "Python CCXT Code" in the Strategy Studio to download your customized quantbot.py script.'}
                  </li>
                  <li>
                    {lang === 'FA'
                      ? 'اجرا در ترمینال:'
                      : 'Execute in terminal:'}
                    <div className="p-2 mt-1 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs ltr" dir="ltr">
                      python quantbot.py
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>{lang === 'FA' ? 'داکر و پایتون آماده اجرا' : 'Docker & Python ready to run'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            {lang === 'FA' ? 'بستن راهنما' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
