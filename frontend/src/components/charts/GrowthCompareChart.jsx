import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#6B7280'];

const GrowthCompareChart = ({ data = [], tickers = [] }) => (
  <div className="h-80 w-full rounded-lg border border-[#374151] bg-[#0A0F1E] p-4">
    {data.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#374151" strokeWidth={0.5} />
          <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          {tickers.map((ticker, index) => (
            <Line
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={colors[index % colors.length]}
              strokeWidth={ticker === 'SPY' ? 1.5 : 2}
              strokeDasharray={ticker === 'SPY' ? '4 2' : undefined}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
        Run a comparison to load growth data from SQL Server.
      </div>
    )}
  </div>
);

export default GrowthCompareChart;
