const CompareStatsTable = ({ rows = [] }) => (
  <section className="overflow-hidden rounded-xl border border-[#374151] bg-[#111827]">
    <table className="w-full text-left">
      <thead className="bg-[#1F2937] font-mono text-xs uppercase text-[#6B7280]">
        <tr>{['STOCK', 'TOTAL GROWTH', 'VOLATILITY', 'VS SPY'].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker} className="border-b border-[#374151]">
            <td className="px-5 py-3.5 font-mono font-bold text-[#F9FAFB]">{row.ticker}</td>
            <td className="px-5 py-3.5 font-mono text-[#10B981]">{row.growth}</td>
            <td className="px-5 py-3.5 font-mono text-[#F59E0B]">{row.volatility}</td>
            <td className="px-5 py-3.5 font-mono text-[#10B981]">{row.vsSpy}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default CompareStatsTable;
