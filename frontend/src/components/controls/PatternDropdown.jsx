import { PATTERN_TYPES } from '../../utils/constants';

const PatternDropdown = ({ value, onChange }) => (
  <label>
    <span className="mb-1 block text-xs text-[#9CA3AF]">Pattern Type</span>
    <select
      className="w-64 rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2 text-sm text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    >
      {PATTERN_TYPES.map((pattern) => (
        <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
      ))}
    </select>
  </label>
);

export default PatternDropdown;
