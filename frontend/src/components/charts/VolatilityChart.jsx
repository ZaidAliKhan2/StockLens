import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const VolatilityChart = ({ data = [] }) => {
  const chartData = data.map((row) => ({
    ticker: row.ticker,
    volatility: Number(row.volatility || 0),
  }));

  return (
  <div className="h-64 w-full rounded-lg border border-[#374151] bg-[#0A0F1E] p-4">
    {chartData.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="#374151" strokeWidth={0.5} />
          <XAxis dataKey="ticker" stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          <Bar dataKey="volatility" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
        Apply filters to load volatility data.
      </div>
    )}
  </div>
  );
};

export default VolatilityChart;
