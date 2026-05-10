const StockLensLogo = ({ size = 'default' }) => {
  const iconClass = size === 'small' ? 'h-5 w-5' : 'h-6 w-6';
  const textClass = size === 'small' ? 'text-sm' : 'text-xl';

  return (
    <div className="flex items-center gap-2">
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19V9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 7V5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 19V5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 19v-7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 10V7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <rect x="3" y="9" width="4" height="7" rx="1" fill="#10B981" />
        <rect x="10" y="8" width="4" height="6" rx="1" fill="#10B981" />
        <rect x="17" y="12" width="4" height="4" rx="1" fill="#10B981" />
      </svg>
      <span className={`font-bold text-[#F9FAFB] ${textClass}`}>StockLens</span>
    </div>
  );
};

export default StockLensLogo;
