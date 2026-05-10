const StatCard = ({ label, value, valueClass = 'text-[#F9FAFB]', note }) => (
  <article className="rounded-xl border border-[#374151] bg-[#111827] p-4">
    <div className="mb-1 font-mono text-xs text-[#6B7280]">{label}</div>
    <div className={`font-mono text-xl font-bold ${valueClass}`}>{value}</div>
    {note ? <div className="text-xs text-[#6B7280]">{note}</div> : null}
  </article>
);

export default StatCard;
