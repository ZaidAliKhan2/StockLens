import { Link } from 'react-router-dom';
import StockLensLogo from '../../components/layout/StockLensLogo';

export const inputClass = 'w-full rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#10B981]';

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <main className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-6 py-10">
    <section className="w-full max-w-md rounded-xl border border-[#374151] bg-[#111827] p-6 shadow-2xl sm:p-8">
      <Link to="/" className="flex justify-center">
        <StockLensLogo />
      </Link>
      <h1 className="mt-6 text-center text-2xl font-bold text-[#F9FAFB]">{title}</h1>
      <p className="mt-1 text-center text-sm text-[#9CA3AF]">{subtitle}</p>
      {children}
      {footer ? <div className="mt-6 border-t border-[#374151] pt-6 text-center text-sm text-[#9CA3AF]">{footer}</div> : null}
    </section>
  </main>
);

export default AuthLayout;
