import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { explainResult } from '../../api/ai.api';
import AIExplainer from '../../components/ai/AIExplainer';
import StatCard from '../../components/cards/StatCard';
import PriceLineChart from '../../components/charts/PriceLineChart';
import DateRangePicker from '../../components/controls/DateRangePicker';
import TickerInput from '../../components/controls/TickerInput';
import PageWrapper from '../../components/layout/PageWrapper';
import useStockData from '../../hooks/useStockData';
import { formatCurrency, formatDate } from '../../utils/formatters';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const formatVolume = (value) => {
  const number = toNumber(value);

  if (number === null) {
    return 'N/A';
  }

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return number.toLocaleString();
};

const getDateKey = (row) => row.trade_date || row.date || row.Date;
const getClose = (row) => row.close_price ?? row.close ?? row.Close;

const formatChartDate = (date) => {
  if (!date) {
    return 'N/A';
  }

  return new Date(date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

const buildChartData = (history, movingAverages) => {
  const byDate = new Map();

  history.forEach((row) => {
    const rawDate = getDateKey(row);
    if (!rawDate) {
      return;
    }

    const key = new Date(rawDate).toISOString().slice(0, 10);
    byDate.set(key, {
      date: formatChartDate(rawDate),
      close: toNumber(getClose(row)),
    });
  });

  movingAverages.forEach((row) => {
    const rawDate = getDateKey(row);
    if (!rawDate) {
      return;
    }

    const key = new Date(rawDate).toISOString().slice(0, 10);
    const existing = byDate.get(key) || { date: formatChartDate(rawDate) };
    byDate.set(key, {
      ...existing,
      close: existing.close ?? toNumber(getClose(row)),
      ma20: toNumber(row.ma_20 ?? row.ma20),
      ma50: toNumber(row.ma_50 ?? row.ma50),
    });
  });

  return Array.from(byDate.values()).filter((row) => row.close !== null);
};

const ExplorerPage = () => {
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [filters, setFilters] = useState({
    ticker: (searchParams.get('ticker') || 'AAPL').toUpperCase(),
    start: searchParams.get('start') || '2023-01-01',
    end: searchParams.get('end') || '2024-01-01',
  });
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [aiText, setAiText] = useState('Run an analysis to generate a plain-English summary from the returned price data.');
  const [aiLoading, setAiLoading] = useState(false);
  const { data, loading, error, loadStockData } = useStockData();

  const generateExplanation = async (nextFilters, nextData) => {
    const nextChartData = buildChartData(nextData.history || [], nextData.movingAverages || []);
    const first = nextChartData[0]?.close;
    const last = nextChartData[nextChartData.length - 1]?.close;
    const change = first && last ? ((last - first) / first) * 100 : null;

    if (!nextChartData.length) {
      setAiText('No price history was returned for this selection.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await explainResult('price-history', {
        ticker: nextFilters.ticker,
        start: nextFilters.start,
        end: nextFilters.end,
        firstPrice: first?.toFixed(2),
        lastPrice: last?.toFixed(2),
        changePct: change === null ? 'N/A' : change.toFixed(2),
      });
      setAiText(response.data?.explanation || 'Explanation unavailable. The price data still loaded successfully.');
    } catch (err) {
      setAiText(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const nextFilters = {
      ticker: (searchParams.get('ticker') || 'AAPL').toUpperCase(),
      start: searchParams.get('start') || '2023-01-01',
      end: searchParams.get('end') || '2024-01-01',
    };
    setFilters(nextFilters);
    loadStockData(nextFilters).then((nextData) => {
      generateExplanation(nextFilters, nextData);
    });
  }, [searchKey]);

  const chartData = useMemo(
    () => buildChartData(data.history, data.movingAverages),
    [data.history, data.movingAverages],
  );

  const stats = data.stats || {};
  const best = data.bestWorst?.best;
  const worst = data.bestWorst?.worst;
  const firstClose = chartData[0]?.close;
  const lastClose = chartData[chartData.length - 1]?.close;
  const changePct = firstClose && lastClose ? ((lastClose - firstClose) / firstClose) * 100 : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextFilters = {
      ...filters,
      ticker: filters.ticker.trim().toUpperCase(),
    };
    loadStockData(nextFilters).then((nextData) => {
      generateExplanation(nextFilters, nextData);
    });
  };

  return (
    <PageWrapper
      active="Stock Explorer"
      title="Stock Explorer"
      subtitle="Analyze historical price data, moving averages, and volatility"
    >
      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[#374151] bg-[#111827] p-4">
        <TickerInput
          value={filters.ticker}
          onChange={(ticker) => setFilters((current) => ({ ...current, ticker }))}
        />
        <DateRangePicker
          start={filters.start}
          end={filters.end}
          onChange={(range) => setFilters((current) => ({ ...current, ...range }))}
        />
        <div>
          <span className="mb-1 block text-xs text-[#9CA3AF]">Moving Averages</span>
          <div className="flex gap-3">
            <label className="font-mono text-xs text-[#3B82F6]">
              <input className="mr-1 accent-[#3B82F6]" type="checkbox" checked={showMA20} onChange={(event) => setShowMA20(event.target.checked)} />
              20-day
            </label>
            <label className="font-mono text-xs text-[#F59E0B]">
              <input className="mr-1 accent-[#F59E0B]" type="checkbox" checked={showMA50} onChange={(event) => setShowMA50(event.target.checked)} />
              50-day
            </label>
          </div>
        </div>
        <button disabled={loading} className="w-full rounded-lg bg-[#10B981] px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto lg:ml-auto">
          {loading ? 'Loading...' : 'Analyze →'}
        </button>
      </form>

      {error ? (
        <div className="mb-6 rounded-xl border border-[#EF4444] bg-[#111827] p-4 text-sm text-[#EF4444]">
          {error}
        </div>
      ) : null}

      <section className="mb-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-[#F9FAFB]">{filters.ticker.toUpperCase()} — Price History</h2>
            <p className="font-mono text-xs text-[#6B7280]">
              {formatDate(filters.start)} – {formatDate(filters.end)} · {chartData.length} trading rows
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#9CA3AF]">
            <span>● Close Price</span>
            {showMA20 ? <span className="text-[#3B82F6]">● 20-day MA</span> : null}
            {showMA50 ? <span className="text-[#F59E0B]">● 50-day MA</span> : null}
          </div>
        </div>
        <PriceLineChart data={chartData} showMA20={showMA20} showMA50={showMA50} />
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Period High" value={formatCurrency(stats.period_high)} valueClass="text-[#10B981]" />
        <StatCard label="Period Low" value={formatCurrency(stats.period_low)} valueClass="text-[#EF4444]" />
        <StatCard label="Avg Close" value={formatCurrency(stats.avg_close)} />
        <StatCard label="Avg Volume" value={formatVolume(stats.avg_volume)} />
        <StatCard label="Volatility" value={toNumber(stats.volatility)?.toFixed(2) || 'N/A'} valueClass="text-[#F59E0B]" note="std dev" />
        <StatCard label="52W High" value={formatCurrency(stats.week52_high)} valueClass="text-[#10B981]" />
        <StatCard label="52W Low" value={formatCurrency(stats.week52_low)} valueClass="text-[#EF4444]" />
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#10B981] border-opacity-40 bg-[#111827] p-5">
          <div className="text-sm font-semibold text-[#10B981]">↗ Best Month</div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#F9FAFB]">{best?.month || 'N/A'}</div>
          <div className="font-mono text-sm text-[#10B981]">{best?.month_range_pct ?? 'N/A'}% price range</div>
          <div className="mt-1 font-mono text-xs text-[#6B7280]">
            Low: {formatCurrency(best?.month_low)} · High: {formatCurrency(best?.month_high)}
          </div>
        </div>
        <div className="rounded-xl border border-[#EF4444] border-opacity-40 bg-[#111827] p-5">
          <div className="text-sm font-semibold text-[#EF4444]">↘ Worst Month</div>
          <div className="mt-2 font-mono text-2xl font-bold text-[#F9FAFB]">{worst?.month || 'N/A'}</div>
          <div className="font-mono text-sm text-[#EF4444]">{worst?.month_range_pct ?? 'N/A'}% price range</div>
          <div className="mt-1 font-mono text-xs text-[#6B7280]">
            Low: {formatCurrency(worst?.month_low)} · High: {formatCurrency(worst?.month_high)}
          </div>
        </div>
      </section>

      <AIExplainer
        text={aiText}
        footer={`Generated from loaded StockLens data · ${filters.start} to ${filters.end}`}
        onRegenerate={() => generateExplanation(filters, data)}
        loading={aiLoading}
      />
    </PageWrapper>
  );
};

export default ExplorerPage;
