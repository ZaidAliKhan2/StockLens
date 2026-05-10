import Sidebar from './Sidebar';

const PageWrapper = ({ active, title, subtitle, badge, children }) => (
  <div className="min-h-screen bg-[#0A0F1E]">
    <Sidebar active={active} />
    <main className="min-h-screen overflow-y-auto bg-[#0A0F1E] p-4 lg:ml-56 lg:p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F9FAFB]">{title}</h1>
          <p className="text-sm text-[#9CA3AF]">{subtitle}</p>
        </div>
        {badge ? (
          <div className="w-fit rounded-full border border-[#374151] bg-[#1F2937] px-3 py-1 font-mono text-xs text-[#6B7280]">
            {badge}
          </div>
        ) : null}
      </header>
      {children}
    </main>
  </div>
);

export default PageWrapper;
