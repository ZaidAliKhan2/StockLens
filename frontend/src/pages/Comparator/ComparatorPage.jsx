import { useEffect, useMemo, useState } from 'react';
import { explainResult } from '../../api/ai.api';
import AIExplainer from '../../components/ai/AIExplainer';
import GrowthCompareChart from '../../components/charts/GrowthCompareChart';
import TickerInput from '../../components/controls/TickerInput';
import PageWrapper from '../../components/layout/PageWrapper';
import useComparator from '../../hooks/useComparator';
import { TICKERS } from '../../utils/constants';
import { formatDate, formatPercent } from '../../utils/formatters';

const colors = ['text-[#3B82F6]', 'text-[#10B981]', 'text-[#8B5CF6]', 'text-[#6B7280]'];
const inputThemes = {
  ticker1: { borderClass: 'border-[#3B82F6]', textClass: 'text-[#3B82F6]', focusClass: 'focus:ring-[#3B82F6]' },
  ticker2: { borderClass: 'border-[#10B981]', textClass: 'text-[#10B981]', focusClass: 'focus:ring-[#10B981]' },
  ticker3: { borderClass: 'border-[#8B5CF6]', textClass: 'text-[#8B5CF6]', focusClass: 'focus:ring-[#8B5CF6]' },
};

const toChartRows = (series = []) => {
  const rowsByDate = new Map();

  series.forEach(({ ticker, data }) => {
    data.forEach((point) => {
      const rawDate = point.date || point.trade_date;
      const key = new Date(rawDate).toISOString().slice(0, 10);
      const row = rowsByDate.get(key) || { date: new Date(rawDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) };
      row[ticker] = Number(point.pct_growth);
      rowsByDate.set(key, row);
    });
  });

  return Array.from(rowsByDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
};

const buildSummaryRows = (series = []) => series.map((item, index) => {
  const first = item.data[0]?.pct_growth;
  const latest = item.data[item.data.length - 1]?.pct_growth;
  return {
    ticker: item.ticker,
    color: colors[index % colors.length],
    points: item.data.length,
    first,
    latest,
  };
});

const ComparatorPage = () => {
  const [form, setForm] = useState({ ticker1: 'AAPL', ticker2: 'MSFT', ticker3: 'SPY', start: '2023-01-01', end: '2024-01-01' });
  const [aiText, setAiText] = useState('Run a comparison to generate a plain-English explanation from the returned growth and correlation data.');
  const [aiLoading, setAiLoading] = useState(false);
  const { comparison, correlation, loading, error, runComparison } = useComparator();

  const tickers = useMemo(
    () => [form.ticker1, form.ticker2, form.ticker3].map((ticker) => ticker.trim().toUpperCase()).filter(Boolean),
    [form],
  );
  const chartData = useMemo(() => toChartRows(comparison?.series || []), [comparison]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value.toUpperCase?.() || value }));

  const generateExplanation = async (nextComparison = comparison) => {
    const nextSummaryRows = buildSummaryRows(nextComparison?.series || []);
    setAiLoading(true);
    try {
      const growthSummary = nextSummaryRows.map((row) => `${row.ticker}: ${formatPercent(row.latest)}`).join(', ');
      const spyRow = nextSummaryRows.find((row) => row.ticker === 'SPY');
      const response = await explainResult('compare', {
        tickers,
        start: form.start,
        end: form.end,
        growthSummary,
        spyGrowth: spyRow?.latest ?? 'N/A',
      });
      setAiText(response.data?.explanation || 'Explanation unavailable. The comparison still loaded successfully.');
    } catch (err) {
      setAiText(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const submit = async (event) => {
    event?.preventDefault();
    const result = await runComparison({ tickers, start: form.start, end: form.end });
    await generateExplanation(result.comparison);
  };

  useEffect(() => {
    runComparison({ tickers, start: form.start, end: form.end }).then((result) => {
      generateExplanation(result.comparison);
    });
  }, []);

  const summaryRows = buildSummaryRows(comparison?.series || []);

  const regenerateExplanation = async () => {
    await generateExplanation(comparison);
  };

  return (
    <PageWrapper active="Comparator" title="Stock Comparator" subtitle="Compare normalized growth of 2–3 stocks against the SPY market benchmark">
      <form onSubmit={submit} className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
        <div className="flex flex-wrap items-end gap-4 lg:gap-5">
          <TickerInput label="Stock 1" value={form.ticker1} onChange={(ticker) => update('ticker1', ticker)} className="w-28" {...inputThemes.ticker1} />
          <TickerInput label="Stock 2" value={form.ticker2} onChange={(ticker) => update('ticker2', ticker)} className="w-28" {...inputThemes.ticker2} />
          <TickerInput label="Stock 3 (optional)" value={form.ticker3} onChange={(ticker) => update('ticker3', ticker)} className="w-28" {...inputThemes.ticker3} suggestions={['SPY', 'SP500', ...TICKERS]} />
          <label><span className="mb-1 block text-xs text-[#9CA3AF]">From</span><input className="w-40 rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" type="date" value={form.start} onChange={(event) => update('start', event.target.value)} /></label>
          <label><span className="mb-1 block text-xs text-[#9CA3AF]">To</span><input className="w-40 rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" type="date" value={form.end} onChange={(event) => update('end', event.target.value)} /></label>
          <button disabled={loading} className="w-full rounded-lg bg-[#10B981] px-7 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:ml-auto">{loading ? 'Comparing...' : 'Compare →'}</button>
        </div>
      </form>

      {error ? <div className="mb-6 rounded-xl border border-[#EF4444] bg-[#111827] p-4 text-sm text-[#EF4444]">{error}</div> : null}

      <section className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:justify-between">
          <div><h2 className="font-semibold text-[#F9FAFB]">Indexed Growth — normalized to 0% at start date</h2><p className="font-mono text-xs text-[#6B7280]">{formatDate(form.start)} – {formatDate(form.end)}</p></div>
          <div className="flex flex-wrap gap-3 text-xs text-[#9CA3AF]">{tickers.map((ticker, index) => <span key={ticker} className={colors[index % colors.length]}>● {ticker}</span>)}</div>
        </div>
        <GrowthCompareChart data={chartData} tickers={tickers} />
      </section>

      <section className="mb-6 overflow-x-auto rounded-xl border border-[#374151] bg-[#111827]">
        <h2 className="border-b border-[#374151] px-5 py-4 font-semibold text-[#F9FAFB]">Performance Summary</h2>
        <table className="w-full min-w-[640px]">
          <thead className="bg-[#1F2937] text-left font-mono text-xs uppercase text-[#6B7280]"><tr>{['STOCK', 'START GROWTH', 'LATEST GROWTH', 'DATA POINTS'].map((h) => <th className="px-5 py-3" key={h}>{h}</th>)}</tr></thead>
          <tbody>{summaryRows.map((row) => <tr key={row.ticker} className="border-b border-[#374151]"><td className={`px-5 py-3.5 font-mono font-bold ${row.color}`}>{row.ticker}</td><td className="px-5 py-3.5 font-mono text-[#9CA3AF]">{formatPercent(row.first)}</td><td className="px-5 py-3.5 font-mono font-bold text-[#10B981]">{formatPercent(row.latest)}</td><td className="px-5 py-3.5 font-mono text-[#F9FAFB]">{row.points}</td></tr>)}</tbody>
        </table>
        {!summaryRows.length ? <div className="px-5 py-8 text-center text-sm text-[#6B7280]">No comparison rows returned.</div> : null}
      </section>

      <section className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-4">
        <h3 className="text-sm font-semibold text-[#F9FAFB]">{correlation?.ticker1 || tickers[0]} ↔ {correlation?.ticker2 || tickers[1]}</h3>
        <div className="mt-2 font-mono text-3xl font-bold text-[#10B981]">{correlation?.coefficient ?? 'N/A'}</div>
        <p className="mt-1 text-xs text-[#9CA3AF]">{correlation?.dataPoints || 0} overlapping data points</p>
      </section>

      <AIExplainer text={aiText} onRegenerate={regenerateExplanation} loading={aiLoading} />
    </PageWrapper>
  );
};

export default ComparatorPage;
