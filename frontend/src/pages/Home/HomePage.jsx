import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import StockLensLogo from '../../components/layout/StockLensLogo';

const tickerStrip = [
  ['AAPL', '+1.24%', 'text-[#10B981]'],
  ['MSFT', '-0.38%', 'text-[#EF4444]'],
  ['NVDA', '+3.67%', 'text-[#10B981]'],
  ['TSLA', '-2.11%', 'text-[#EF4444]'],
  ['GOOGL', '+0.89%', 'text-[#10B981]'],
  ['JPM', '+0.52%', 'text-[#10B981]'],
  ['SPY', '+0.34%', 'text-[#10B981]'],
  ['AMD', '+4.21%', 'text-[#10B981]'],
];

const featureCards = [
  {
    title: 'Stock Explorer',
    color: '#3B82F6',
    description: 'Enter any ticker and date range. Get price history, 20/50-day moving averages, volatility score, and 52-week highs and lows — all from SQL window functions.',
    tag: 'Price history · Moving averages',
  },
  {
    title: 'Pattern Finder',
    color: '#10B981',
    description: 'Detect consecutive green days, volume spikes, and moving average crossovers across all tracked stocks — powered by 4-CTE SQL chains.',
    tag: 'Green-day streaks · Volume spikes',
  },
  {
    title: 'Stock Comparator',
    color: '#F59E0B',
    description: 'Compare 2–3 stocks on a normalized growth chart, see correlation coefficients, and benchmark everything against SPY.',
    tag: 'Growth comparison · Correlation',
  },
  {
    title: 'Screener',
    color: '#8B5CF6',
    description: 'Filter by sector, price range, minimum volume, and growth percentage. Results are ranked by volatility within each sector using RANK() OVER.',
    tag: 'Sector filters · Volatility ranks',
  },
];

const techBadges = ['SQL Server Express', 'Node.js + Express', 'React 18', 'Recharts', 'yfinance', 'Gemini API', 'Tailwind CSS'];

const HomePage = () => (
  <div className="min-h-screen bg-[#0A0F1E]">
    <Navbar />
    <section className="bg-[#0A0F1E] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto inline-flex rounded-full border border-[#374151] bg-[#1F2937] px-3 py-1 font-mono text-xs text-[#10B981]">
          DBMS PROJECT · CSL-220 · BAHRIA UNIVERSITY
        </div>
        <h1 className="mt-6 text-4xl font-bold leading-tight text-[#F9FAFB] lg:text-5xl">
          Query-Driven <span className="text-[#10B981]">Intelligence</span>
          <br />
          for Historical Stock Data
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
          Explore 10 years of real OHLC data across 30+ US stocks. Detect patterns, compare performance, and screen by sector — all powered by SQL analytics and explained by AI.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link to="/login" className="cursor-pointer rounded-lg bg-[#10B981] px-8 py-3 text-base font-semibold text-black transition-colors duration-200">
            Start Exploring
          </Link>
          <a href="https://github.com" className="cursor-pointer rounded-lg border border-[#374151] px-8 py-3 text-base text-[#F9FAFB] transition-colors duration-200 hover:bg-[#1F2937]">
            View on GitHub
          </a>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4 font-mono text-sm sm:gap-6">
          {['30+ Stocks Tracked', '10 Years of Data', '11 SQL Stored Procedures'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-[#9CA3AF]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="font-semibold text-[#F9FAFB]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
    <section className="border-y border-[#374151] bg-[#111827] py-3">
      <div className="mx-auto flex max-w-7xl overflow-x-auto px-6">
        {tickerStrip.map(([ticker, pct, color]) => (
          <div key={ticker} className="border-r border-[#374151] px-6 font-mono text-sm">
            <span className="font-semibold text-[#F9FAFB]">{ticker}</span>
            <span className={`ml-3 ${color}`}>{pct}</span>
          </div>
        ))}
      </div>
    </section>
    <section className="bg-[#0A0F1E] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#F9FAFB]">Everything you need to analyze stock history</h2>
          <p className="mt-2 text-[#9CA3AF]">Query-driven tools for exploration, patterns, comparison, and screening.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-[#374151] bg-[#111827] p-6">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 17l5-5 4 3 7-8" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-[#F9FAFB]">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{card.description}</p>
              <div className="mt-4 border-t border-[#374151] pt-4 font-mono text-xs text-[#6B7280]">{card.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <section className="border-y border-[#374151] bg-[#111827] py-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2">
        <div>
          <div className="font-mono text-xs font-semibold tracking-widest text-[#10B981]">AI EXPLAINER</div>
          <h2 className="mt-2 text-3xl font-bold text-[#F9FAFB]">Every result explained in plain English</h2>
          <p className="mt-4 leading-relaxed text-[#9CA3AF]">
            After every query, StockLens sends the result data to the Gemini API. You get a 2–4 sentence plain-English summary that explains what the pattern means — without any financial jargon or advice.
          </p>
          <div className="mt-6 font-mono text-xs text-[#6B7280]">Powered by gemini-1.5-flash · Falls back gracefully if unavailable</div>
        </div>
        <div className="rounded-xl border border-[#374151] bg-[#0A0F1E] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#10B981]">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            AI Explainer
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[#9CA3AF]">
            NVDA showed 8 consecutive green days ending Jan 15, 2024 — the longest streak in the current scan window. This kind of sustained upward momentum often reflects strong institutional buying or positive earnings momentum. Four other stocks in the Technology sector showed streaks of 5+ days simultaneously, suggesting broader sector strength rather than a single-stock event.
          </p>
          <div className="mt-4 font-mono text-xs text-[#6B7280]">Generated by Gemini · Not financial advice</div>
        </div>
      </div>
    </section>
    <section className="py-12 text-center">
      <h2 className="mb-6 font-mono text-sm tracking-widest text-[#6B7280]">Built with</h2>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-4 px-6">
        {techBadges.map((badge) => (
          <span key={badge} className="rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 font-mono text-sm text-[#9CA3AF]">
            {badge}
          </span>
        ))}
      </div>
    </section>
    <footer className="border-t border-[#374151] bg-[#0A0F1E] py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <StockLensLogo size="small" />
          <p className="mt-2 text-sm text-[#6B7280]">CSL-220 DBMS Project · Bahria University Karachi · 2026</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[#6B7280]">
          <Link to="/explorer">Stock Explorer</Link>
          <Link to="/patterns">Pattern Finder</Link>
          <Link to="/screener">Screener</Link>
        </div>
      </div>
      <p className="mt-6 text-center font-mono text-xs text-[#6B7280]">
        All data sourced from Yahoo Finance via yfinance · Historical data only · Not a financial advisory tool
      </p>
    </footer>
  </div>
);

export default HomePage;
