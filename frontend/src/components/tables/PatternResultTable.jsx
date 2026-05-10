const PatternResultTable = ({ rows = [] }) => (
  <section className="overflow-hidden rounded-xl border border-[#374151] bg-[#111827]">
    <table className="w-full">
      <thead className="border-b border-[#374151] bg-[#1F2937] text-left font-mono text-xs uppercase tracking-wider text-[#6B7280]">
        <tr>{['TICKER', 'COMPANY', 'SECTOR', 'STREAK LENGTH', 'LAST GREEN DAY'].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.ticker}-${row.streak_end}`} className="border-b border-[#374151] hover:bg-[#1F2937]">
            <td className="px-5 py-3.5 font-mono font-bold text-[#F9FAFB]">{row.ticker}</td>
            <td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.company_name}</td>
            <td className="px-5 py-3.5 text-sm text-[#9CA3AF]">{row.sector_name}</td>
            <td className="px-5 py-3.5 font-mono text-[#10B981]">{row.streak_len}</td>
            <td className="px-5 py-3.5 font-mono text-[#9CA3AF]">{row.streak_end}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default PatternResultTable;
