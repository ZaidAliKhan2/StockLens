import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { explainResult } from '../../api/ai.api';
import AIExplainer from '../../components/ai/AIExplainer';
import PageWrapper from '../../components/layout/PageWrapper';
import usePatterns from '../../hooks/usePatterns';
import { formatDate } from '../../utils/formatters';

const patternOptions = [
  { value: 'green-days', label: 'Consecutive Green Days' },
  { value: 'volume-spike', label: 'Volume Spike' },
  { value: 'ma-crossover', label: 'MA Crossover' },
];

const getPatternParams = (patternType, form) => {
  if (patternType === 'volume-spike') {
    return { multiplier: form.multiplier, lookbackDays: form.lookbackDays };
  }

  if (patternType === 'ma-crossover') {
    return { shortMA: form.shortMA, longMA: form.longMA, lookbackDays: form.lookbackDays };
  }

  return { minDays: form.minDays, lookbackDays: form.lookbackDays };
};

const PatternFinderPage = () => {
  const navigate = useNavigate();
  const [patternType, setPatternType] = useState('green-days');
  const [form, setForm] = useState({
    minDays: 5,
    multiplier: 2.5,
    shortMA: 20,
    longMA: 50,
    lookbackDays: 90,
  });
  const [aiText, setAiText] = useState('Run a scan to generate a plain-English explanation from the returned pattern results.');
  const [aiLoading, setAiLoading] = useState(false);
  const { results, loading, error, runPattern } = usePatterns();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const generateExplanation = async (nextResults, nextPatternType = patternType, nextForm = form) => {
    setAiLoading(true);
    try {
      const response = await explainResult(nextPatternType, {
        count: nextResults.length,
        minDays: nextForm.minDays,
        multiplier: nextForm.multiplier,
        shortMA: nextForm.shortMA,
        longMA: nextForm.longMA,
        lookback: nextForm.lookbackDays,
        topResults: nextResults.slice(0, 5),
      });
      setAiText(response.data?.explanation || 'Explanation unavailable. The data query still completed successfully.');
    } catch (err) {
      setAiText(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const runScan = async (event) => {
    event?.preventDefault();
    const nextResults = await runPattern(patternType, getPatternParams(patternType, form));
    await generateExplanation(nextResults || [], patternType, form);
  };

  useEffect(() => {
    runPattern(patternType, getPatternParams(patternType, form)).then((nextResults) => {
      generateExplanation(nextResults || [], patternType, form);
    });
  }, []);

  const longestStreak = useMemo(
    () => Math.max(0, ...results.map((row) => Number(row.streak_len || row.streak_length || 0))),
    [results],
  );

  const regenerateExplanation = async () => {
    await generateExplanation(results, patternType, form);
  };

  const headers = patternType === 'volume-spike'
    ? ['TICKER', 'COMPANY', 'DATE', 'VOLUME', '30D AVG', 'RATIO', 'ACTION']
    : patternType === 'ma-crossover'
      ? ['TICKER', 'COMPANY', 'DATE', 'TYPE', 'SHORT MA', 'LONG MA', 'ACTION']
      : ['TICKER', 'COMPANY', 'STREAK LENGTH', 'LAST GREEN DAY', 'ACTION'];

  return (
    <PageWrapper active="Pattern Finder" title="Pattern Finder" subtitle="Scan all tracked stocks for technical patterns using SQL window functions">
      <form onSubmit={runScan} className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
        <div className="flex flex-wrap items-end gap-4 lg:gap-6">
          <label>
            <span className="mb-1 block text-xs text-[#9CA3AF]">Pattern Type</span>
            <select className="w-64 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#10B981]" value={patternType} onChange={(event) => setPatternType(event.target.value)}>
              {patternOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {patternType === 'green-days' ? (
            <label><span className="mb-1 block text-xs text-[#9CA3AF]">Min Streak Length</span><input className="w-36 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]" type="number" min="2" max="30" value={form.minDays} onChange={(event) => update('minDays', event.target.value)} /></label>
          ) : null}
          {patternType === 'volume-spike' ? (
            <label><span className="mb-1 block text-xs text-[#9CA3AF]">Volume Multiplier</span><input className="w-36 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]" type="number" min="1.5" max="10" step="0.1" value={form.multiplier} onChange={(event) => update('multiplier', event.target.value)} /></label>
          ) : null}
          {patternType === 'ma-crossover' ? (
            <>
              <label><span className="mb-1 block text-xs text-[#9CA3AF]">Short MA</span><input className="w-28 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]" type="number" min="2" value={form.shortMA} onChange={(event) => update('shortMA', event.target.value)} /></label>
              <label><span className="mb-1 block text-xs text-[#9CA3AF]">Long MA</span><input className="w-28 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]" type="number" min="3" value={form.longMA} onChange={(event) => update('longMA', event.target.value)} /></label>
            </>
          ) : null}
          <label><span className="mb-1 block text-xs text-[#9CA3AF]">Lookback (days)</span><input className="w-36 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]" type="number" min="1" max="365" value={form.lookbackDays} onChange={(event) => update('lookbackDays', event.target.value)} /></label>
          <button disabled={loading} className="w-full rounded-lg bg-[#10B981] px-8 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:ml-auto">{loading ? 'Scanning...' : '▶ Run Scan →'}</button>
        </div>
      </form>

      {error ? <div className="mb-6 rounded-xl border border-[#EF4444] bg-[#111827] p-4 text-sm text-[#EF4444]">{error}</div> : null}

      <section className="mb-4 flex flex-wrap gap-4">
        <div className="rounded-lg border border-[#374151] bg-[#111827] px-4 py-2 font-mono text-sm text-[#F9FAFB]">{results.length} stocks matched</div>
        {patternType === 'green-days' ? <div className="rounded-lg border border-[#374151] bg-[#111827] px-4 py-2 font-mono text-sm text-[#10B981]">Longest streak: {longestStreak} days</div> : null}
        <div className="rounded-lg border border-[#374151] bg-[#111827] px-4 py-2 font-mono text-sm text-[#F9FAFB]">Scan window: {form.lookbackDays} days</div>
      </section>

      <section className="mb-6 overflow-x-auto rounded-xl border border-[#374151] bg-[#111827]">
        <table className="w-full min-w-[920px]">
          <thead className="border-b border-[#374151] bg-[#1F2937] text-left font-mono text-xs uppercase tracking-wider text-[#6B7280]"><tr>{headers.map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={`${row.ticker}-${row.streak_end || row.trade_date || row.crossover_date || index}`} className="border-b border-[#374151] transition-colors hover:bg-[#1F2937]">
                <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#F9FAFB]">{row.ticker}</td>
                <td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.company_name}</td>
                {patternType === 'volume-spike' ? (
                  <>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{formatDate(row.trade_date)}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#F9FAFB]">{Number(row.volume || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{Number(row.avg_vol_30d || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[#10B981]">{Number(row.volume_ratio || 0).toFixed(2)}x</td>
                  </>
                ) : patternType === 'ma-crossover' ? (
                  <>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{formatDate(row.crossover_date)}</td>
                    <td className="px-5 py-3.5"><span className={`rounded px-2 py-0.5 font-mono text-xs ${row.crossover_type === 'bullish' ? 'bg-[#10B981] bg-opacity-20 text-[#10B981]' : 'bg-[#EF4444] bg-opacity-20 text-[#EF4444]'}`}>{row.crossover_type}</span></td>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{Number(row.short_ma_val || 0).toFixed(2)}</td>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{Number(row.long_ma_val || 0).toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3.5"><span className="rounded bg-[#10B981] bg-opacity-20 px-2 py-0.5 font-mono font-bold text-[#10B981]">{row.streak_len} days</span></td>
                    <td className="px-5 py-3.5 font-mono text-sm text-[#9CA3AF]">{formatDate(row.streak_end)}</td>
                  </>
                )}
                <td className="px-5 py-3.5">
                  <button onClick={() => navigate(`/explorer?ticker=${row.ticker}`)} className="text-xs text-[#3B82F6] hover:underline">Explore →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results.length ? <div className="px-5 py-8 text-center text-sm text-[#6B7280]">No stocks matched this pattern in the selected lookback period.</div> : null}
      </section>

      <AIExplainer text={aiText} onRegenerate={regenerateExplanation} loading={aiLoading} />
    </PageWrapper>
  );
};

export default PatternFinderPage;
