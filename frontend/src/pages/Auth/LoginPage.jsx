import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { login } from '../../api/auth.api';
import { saveSession } from '../../utils/authStorage';
import AuthLayout, { inputClass } from './AuthLayout';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/explorer';

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(form);
      saveSession(response.data.token, response.data.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={(
        <>
          Don't have an account? <Link to="/register" className="font-semibold text-[#10B981] hover:underline">Create one</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm text-[#9CA3AF]">Email address</span>
          <input className={inputClass} type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-[#9CA3AF]">Password</span>
          <input className={inputClass} type="password" name="password" value={form.password} onChange={updateField} placeholder="••••••••" autoComplete="current-password" required />
          <span className="mt-1 block text-right text-xs text-[#10B981] hover:underline">Forgot password?</span>
        </label>
        <button disabled={loading} className="mt-2 w-full cursor-pointer rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {error ? (
          <div className="mt-2 rounded-lg border border-[#EF4444] bg-[#1F2937] px-4 py-2.5 text-sm text-[#EF4444]">
            {error}
          </div>
        ) : null}
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
