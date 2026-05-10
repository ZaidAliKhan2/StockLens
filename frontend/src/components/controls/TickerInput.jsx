import { useMemo, useState } from 'react';
import { TICKERS } from '../../utils/constants';

const TickerInput = ({
  label = 'Ticker Symbol',
  value,
  onChange,
  className = 'w-32',
  borderClass = 'border-[#374151]',
  textClass = 'text-[#F9FAFB]',
  focusClass = 'focus:ring-[#10B981]',
  suggestions: suggestionOptions = TICKERS,
}) => {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const normalizedValue = String(value || '').toUpperCase();
  const visibleSuggestions = useMemo(() => {
    const filtered = suggestionOptions.filter((ticker) => ticker.includes(normalizedValue));
    return filtered.length ? filtered : suggestionOptions;
  }, [normalizedValue, suggestionOptions]);

  const selectTicker = (ticker) => {
    onChange?.(ticker);
    setOpen(false);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (event) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % visibleSuggestions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + visibleSuggestions.length) % visibleSuggestions.length);
    }

    if (event.key === 'Enter' && open) {
      event.preventDefault();
      selectTicker(visibleSuggestions[highlightedIndex]);
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs text-[#9CA3AF]">{label}</span>
      <input
        className={`${className} rounded-lg border ${borderClass} bg-[#1F2937] px-4 py-2 font-mono text-sm font-bold uppercase ${textClass} focus:outline-none focus:ring-2 ${focusClass}`}
        type="text"
        value={normalizedValue}
        onChange={(event) => {
          onChange?.(event.target.value.toUpperCase());
          setOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        placeholder="AAPL"
        autoComplete="off"
      />
      {open ? (
        <div className="absolute left-0 z-40 mt-2 max-h-56 w-56 overflow-y-auto rounded-lg border border-[#374151] bg-[#111827] shadow-2xl">
          <div className="grid grid-cols-3 gap-1 p-2">
            {visibleSuggestions.map((ticker, index) => (
              <button
                key={ticker}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectTicker(ticker)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`rounded-md px-2 py-1.5 text-left font-mono text-xs font-bold transition-colors ${
                  index === highlightedIndex
                    ? 'bg-[#10B981] text-black'
                    : 'text-[#F9FAFB] hover:bg-[#1F2937] hover:text-[#10B981]'
                }`}
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </label>
  );
};

export default TickerInput;
