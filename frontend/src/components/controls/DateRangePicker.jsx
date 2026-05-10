const DateRangePicker = ({ start, end, onChange }) => (
  <>
    <label>
      <span className="mb-1 block text-xs text-[#9CA3AF]">From</span>
      <input
        className="w-40 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]"
        type="date"
        value={start}
        onChange={(event) => onChange?.({ start: event.target.value, end })}
      />
    </label>
    <label>
      <span className="mb-1 block text-xs text-[#9CA3AF]">To</span>
      <input
        className="w-40 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB]"
        type="date"
        value={end}
        onChange={(event) => onChange?.({ start, end: event.target.value })}
      />
    </label>
  </>
);

export default DateRangePicker;
