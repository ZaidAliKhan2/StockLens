import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { explainResult } from '../../api/ai.api';
import AIExplainer from '../../components/ai/AIExplainer';
import VolatilityChart from '../../components/charts/VolatilityChart';
import PageWrapper from '../../components/layout/PageWrapper';
import useScreener from '../../hooks/useScreener';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const defaultFilters = {
  sector: '',
  start: '2023-01-01',
  end: '2024-01-01',
  minVolume: 1000000,
  minPrice: 0,
  maxPrice: 999999,
  minGrowthPct: -999,
};

const formatVolume = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toLocaleString();
};

const ScreenerPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [aiText, setAiText] = useState('Apply filters to generate a plain-English explanation from the returned screener results.');
  const [aiLoading, setAiLoading] = useState(false);
  const { results, sectors, volatility, loading, error, loadSectors, screen, loadVolatility } = useScreener();

  const apiFilters = {
    ...filters,
    sector: filters.sector || undefined,
  };

  const generateExplanation = async (nextResults, nextFilters = filters) => {
    setAiLoading(true);
    try {
      const response = await explainResult('screener', {
        count: nextResults.length,
        sector: nextFilters.sector || 'all',
        minVolume: nextFilters.minVolume,
        minPrice: nextFilters.minPrice,
        maxPrice: nextFilters.maxPrice,
        minGrowthPct: nextFilters.minGrowthPct,
        topResults: nextResults.slice(0, 3),
      });
      setAiText(response.data?.explanation || 'Explanation unavailable. The screener data still loaded successfully.');
    } catch (err) {
      setAiText(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyFilters = async (event) => {
    event?.preventDefault();
    const nextResults = await screen(apiFilters);
    await loadVolatility({ sector: filters.sector || undefined, start: filters.start, end: filters.end });
    await generateExplanation(nextResults || [], filters);
  };

  useEffect(() => {
    loadSectors();
    screen(apiFilters).then((nextResults) => {
      generateExplanation(nextResults || [], filters);
    });
    loadVolatility({ sector: filters.sector || undefined, start: filters.start, end: filters.end });
  }, []);

  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setFilters(defaultFilters);
    screen({ ...defaultFilters, sector: undefined }).then((nextResults) => {
      generateExplanation(nextResults || [], defaultFilters);
    });
    loadVolatility({ start: defaultFilters.start, end: defaultFilters.end });
  };

  const regenerateExplanation = async () => {
    await generateExplanation(results, filters);
  };

  return (
    <PageWrapper active="Screener" title="Stock Screener" subtitle="Filter stocks by sector, price, volume, and growth. Ranked by volatility within sector.">
      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border border-[#374151] bg-[#111827] xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
          <div className="flex items-center justify-between border-b border-[#374151] px-5 py-4">
            <h2 className="font-semibold text-[#F9FAFB]">Filters</h2>
            <button type="button" onClick={reset} className="cursor-pointer text-xs text-[#EF4444] hover:underline">Reset</button>
          </div>
          <form onSubmit={applyFilters} className="max-h-[68vh] overflow-y-auto px-5 py-4 xl:max-h-[calc(100vh-8.5rem)]">
            <label className="block"><span className="mb-1 block font-mono text-xs text-[#9CA3AF]">Sector</span><select className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" value={filters.sector} onChange={(event) => update('sector', event.target.value)}><option value="">All Sectors</option>{sectors.map((sector) => <option key={sector.sector_id || sector.sector_name} value={sector.sector_name}>{sector.sector_name}</option>)}</select></label>
            <div className="my-4 border-t border-[#374151]" />
            <div className="space-y-2"><div className="font-mono text-xs text-[#9CA3AF]">Date Range</div><input className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" type="date" value={filters.start} onChange={(event) => update('start', event.target.value)} /><input className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" type="date" value={filters.end} onChange={(event) => update('end', event.target.value)} /></div>
            <div className="my-4 border-t border-[#374151]" />
            <div><div className="flex justify-between font-mono text-xs"><span className="text-[#9CA3AF]">Min Avg Volume</span><span className="font-bold text-[#10B981]">{Number(filters.minVolume).toLocaleString()}</span></div><input className="w-full accent-[#10B981]" type="range" min="1" max="5000000" step="100000" value={filters.minVolume} onChange={(event) => update('minVolume', event.target.value)} /><div className="flex justify-between font-mono text-xs text-[#6B7280]"><span>1</span><span>5M</span></div></div>
            <div className="my-4 border-t border-[#374151]" />
            <label className="block"><span className="mb-2 block font-mono text-xs text-[#9CA3AF]">Price Range ($)</span><div className="grid grid-cols-2 gap-2"><input className="min-w-0 rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 font-mono text-sm text-[#F9FAFB]" type="number" min="0" value={filters.minPrice} onChange={(event) => update('minPrice', event.target.value)} /><input className="min-w-0 rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 font-mono text-sm text-[#F9FAFB]" type="number" min="1" value={filters.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} /></div></label>
            <div className="my-4 border-t border-[#374151]" />
            <label className="block"><span className="mb-1 block font-mono text-xs text-[#9CA3AF]">Min Growth %</span><input className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 font-mono text-sm text-[#F9FAFB]" type="number" value={filters.minGrowthPct} onChange={(event) => update('minGrowthPct', event.target.value)} /><span className="mt-1 block text-xs text-[#6B7280]">Enter negative values to include declining stocks</span></label>
            <button disabled={loading} className="mt-5 w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Loading...' : 'Apply Filters →'}</button>
          </form>
        </aside>
        <section>
          {error ? <div className="mb-6 rounded-xl border border-[#EF4444] bg-[#111827] p-4 text-sm text-[#EF4444]">{error}</div> : null}
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:justify-between"><div><span className="font-semibold text-[#F9FAFB]">{results.length} stocks matched</span> <span className="text-sm text-[#9CA3AF]">for selected filters</span></div><div className="font-mono text-xs text-[#6B7280]">Sorted by overall rank</div></div>
          <div className="mb-6 overflow-x-auto rounded-xl border border-[#374151] bg-[#111827]">
            <table className="w-full min-w-[1120px] text-left">
              <thead className="bg-[#1F2937] font-mono text-xs uppercase tracking-wider text-[#6B7280]"><tr>{['RANK', 'TICKER', 'COMPANY', 'SECTOR', 'AVG CLOSE', 'AVG VOLUME', 'VOLATILITY', 'GROWTH', 'SECTOR RANK', 'ACTION'].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr></thead>
              <tbody>{results.map((row) => <tr key={row.ticker} className="border-b border-[#374151] transition-colors hover:bg-[#1F2937]"><td className="px-5 py-3.5 font-mono font-bold text-[#F9FAFB]">#{row.rank_overall}</td><td className="px-5 py-3.5 font-mono font-bold text-[#10B981]">{row.ticker}</td><td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.company_name}</td><td className="px-5 py-3.5"><span className="rounded border border-[#374151] bg-[#1F2937] px-2 py-0.5 font-mono text-xs text-[#6B7280]">{row.sector_name}</span></td><td className="px-5 py-3.5 font-mono text-[#F9FAFB]">{formatCurrency(row.avg_close)}</td><td className="px-5 py-3.5 font-mono text-sm text-[#F9FAFB]">{formatVolume(row.avg_volume)}</td><td className="px-5 py-3.5 font-mono font-bold text-[#F59E0B]">{Number(row.volatility || 0).toFixed(2)}</td><td className="px-5 py-3.5 font-mono font-bold text-[#10B981]">{formatPercent(row.growth_pct)}</td><td className="px-5 py-3.5 font-mono text-xs text-[#F59E0B]">#{row.rank_in_sector}</td><td className="px-5 py-3.5"><button onClick={() => navigate(`/explorer?ticker=${row.ticker}&start=${filters.start}&end=${filters.end}`)} className="text-xs text-[#3B82F6] hover:underline">Explore →</button></td></tr>)}</tbody>
            </table>
            {!results.length ? <div className="px-5 py-8 text-center text-sm text-[#6B7280]">No stocks matched these filters.</div> : null}
          </div>
          <div className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
            <h2 className="mb-4 font-semibold text-[#F9FAFB]">Volatility Leaders</h2>
            <VolatilityChart data={(volatility.length ? volatility : results).slice(0, 8)} />
          </div>
          <AIExplainer text={aiText} onRegenerate={regenerateExplanation} loading={aiLoading} />
        </section>
      </div>
    </PageWrapper>
  );
};

export default ScreenerPage;
