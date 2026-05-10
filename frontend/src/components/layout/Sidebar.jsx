import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getMe } from '../../api/auth.api';
import { clearSession, getStoredToken, getStoredUser, saveSession } from '../../utils/authStorage';
import StockLensLogo from './StockLensLogo';

const navItems = [
  { label: 'Stock Explorer', to: '/explorer', icon: 'chart' },
  { label: 'Pattern Finder', to: '/patterns', icon: 'search' },
  { label: 'Comparator', to: '/comparator', icon: 'arrows' },
  { label: 'Screener', to: '/screener', icon: 'filter' },
];

const Icon = ({ type }) => {
  if (type === 'search') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'arrows') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 7h11l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 17H6l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'filter') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 17l5-5 4 3 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const getInitials = (nameOrEmail = '') => {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

const Sidebar = ({ active }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);
  const displayName = user?.full_name || user?.email || 'Signed in user';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      return;
    }

    getMe()
      .then((response) => {
        const nextUser = response.data?.user;
        if (nextUser) {
          saveSession(token, nextUser);
          setUser(nextUser);
        }
      })
      .catch(() => {});
  }, []);

  const signOut = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <aside className="border-b border-[#374151] bg-[#111827] lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-56 lg:border-b-0 lg:border-r">
      <div className="px-5 py-4 lg:py-5">
        <StockLensLogo size="small" />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-4 lg:flex-col lg:overflow-visible lg:pb-0">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                isActive
                  ? 'border-l-[3px] border-[#10B981] bg-[#1F2937] font-semibold text-[#10B981]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
              }`}
            >
              <Icon type={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-5 py-5 lg:absolute lg:bottom-0 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#374151] bg-[#1F2937] font-mono text-xs text-[#10B981]">
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-[#F9FAFB]">{displayName}</div>
            <div className="text-xs text-[#6B7280]">{user?.role || 'user'}</div>
          </div>
        </div>
        <button onClick={signOut} className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-[#6B7280] hover:text-[#EF4444]">
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
