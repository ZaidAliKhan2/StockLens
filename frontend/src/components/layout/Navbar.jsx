import { Link } from 'react-router-dom';
import StockLensLogo from './StockLensLogo';

const Navbar = () => (
  <nav className="sticky top-0 z-50 w-full border-b border-[#374151] bg-[#0A0F1E]">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link to="/" className="cursor-pointer">
        <StockLensLogo />
      </Link>
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <Link to="/login" className="text-sm text-[#F9FAFB] hover:underline">
          Log In
        </Link>
        <Link
          to="/register"
          className="cursor-pointer rounded-lg bg-[#10B981] px-5 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-[#059669]"
        >
          Get Started
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;
