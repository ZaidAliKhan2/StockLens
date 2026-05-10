import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const PriceLineChart = ({ data = [], showMA20 = true, showMA50 = true }) => (
  <div className="h-72 w-full rounded-lg border border-[#374151] bg-[#0A0F1E] p-4">
    {data.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="#374151" strokeWidth={0.5} />
          <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontFamily: 'monospace', fontSize: 12 }} />
          <Line type="monotone" dataKey="close" stroke="#F9FAFB" strokeWidth={1.5} dot={false} />
          {showMA20 ? <Line type="monotone" dataKey="ma20" stroke="#3B82F6" strokeWidth={1.5} dot={false} /> : null}
          {showMA50 ? <Line type="monotone" dataKey="ma50" stroke="#F59E0B" strokeWidth={1.5} dot={false} /> : null}
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex h-full items-center justify-center text-sm text-[#6B7280]">
        Run an analysis to load price history from SQL Server.
      </div>
    )}
  </div>
);

export default PriceLineChart;
