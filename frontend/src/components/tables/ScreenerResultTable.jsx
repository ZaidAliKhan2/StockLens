const ScreenerResultTable = ({ rows = [] }) => (
  <section className="overflow-hidden rounded-xl border border-[#374151] bg-[#111827]">
    <table className="w-full text-left">
      <thead className="bg-[#1F2937] font-mono text-xs uppercase tracking-wider text-[#6B7280]">
        <tr>{['RANK', 'TICKER', 'COMPANY', 'SECTOR', 'AVG CLOSE', 'VOLATILITY', 'GROWTH'].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.ticker} className="border-b border-[#374151] hover:bg-[#1F2937]">
            <td className="px-5 py-3.5 font-mono text-[#F9FAFB]">#{row.rank_overall}</td>
            <td className="px-5 py-3.5 font-mono font-bold text-[#10B981]">{row.ticker}</td>
            <td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.company_name}</td>
            <td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.sector_name}</td>
            <td className="px-5 py-3.5 font-mono text-[#F9FAFB]">{row.avg_close}</td>
            <td className="px-5 py-3.5 font-mono text-[#F59E0B]">{row.volatility}</td>
            <td className="px-5 py-3.5 font-mono text-[#10B981]">{row.growth_pct}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default ScreenerResultTable;
