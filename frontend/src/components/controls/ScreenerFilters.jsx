const ScreenerFilters = ({ filters, onChange }) => {
  const update = (key, value) => onChange?.({ ...filters, [key]: value });

  return (
    <aside className="sticky top-6 rounded-xl border border-[#374151] bg-[#111827] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-[#F9FAFB]">Filters</h2>
        <button className="cursor-pointer text-xs text-[#EF4444] hover:underline">Reset</button>
      </div>
      <label className="block">
        <span className="mb-1 block font-mono text-xs text-[#9CA3AF]">Sector</span>
        <input className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-[#F9FAFB]" value={filters.sector || ''} onChange={(event) => update('sector', event.target.value)} placeholder="Technology" />
      </label>
      <div className="my-4 border-t border-[#374151]" />
      <label className="block">
        <span className="mb-1 block font-mono text-xs text-[#9CA3AF]">Min Growth %</span>
        <input className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 font-mono text-sm text-[#F9FAFB]" type="number" value={filters.minGrowthPct || ''} onChange={(event) => update('minGrowthPct', event.target.value)} />
      </label>
    </aside>
  );
};

export default ScreenerFilters;
