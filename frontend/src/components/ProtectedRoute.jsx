import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getMe } from '../api/auth.api';
import {
  AUTH_SESSION_CHANGED_EVENT,
  clearSession,
  getStoredToken,
  saveSession,
} from '../utils/authStorage';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState(() => (getStoredToken() ? 'checking' : 'unauthenticated'));

  useEffect(() => {
    let cancelled = false;
    const token = getStoredToken();

    if (!token) {
      clearSession();
      setStatus('unauthenticated');
      return undefined;
    }

    setStatus('checking');

    getMe()
      .then((response) => {
        if (cancelled) {
          return;
        }

        const user = response.data?.user;

        if (!user) {
          clearSession();
          setStatus('unauthenticated');
          return;
        }

        saveSession(token, user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setStatus('unauthenticated');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleSessionChange = () => {
      if (!getStoredToken()) {
        setStatus('unauthenticated');
      }
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChange);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F1E] px-6 text-center text-sm text-[#9CA3AF]">
        Checking your session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
