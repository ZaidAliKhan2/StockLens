import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { register } from '../../api/auth.api';
import AuthLayout, { inputClass } from './AuthLayout';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password });
      sessionStorage.setItem('stocklens_pending_email', form.email);
      navigate('/verify-otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start analyzing stock history"
      footer={(
        <>
          Already have an account? <Link to="/login" className="font-semibold text-[#10B981] hover:underline">Sign in</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label><span className="mb-1 block text-sm text-[#9CA3AF]">Full name</span><input className={inputClass} type="text" name="full_name" value={form.full_name} onChange={updateField} placeholder="Your name" autoComplete="name" required /></label>
        <label><span className="mb-1 block text-sm text-[#9CA3AF]">Email address</span><input className={inputClass} type="email" name="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required /></label>
        <label><span className="mb-1 block text-sm text-[#9CA3AF]">Password</span><input className={inputClass} type="password" name="password" value={form.password} onChange={updateField} placeholder="Min. 8 characters" autoComplete="new-password" required /></label>
        <label>
          <span className="mb-1 block text-sm text-[#9CA3AF]">Confirm password</span>
          <input className={inputClass} type="password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} placeholder="Repeat your password" autoComplete="new-password" required />
          {error === 'Passwords do not match' ? <span className="mt-1 block text-xs text-[#EF4444]">Passwords do not match</span> : null}
        </label>
        <button disabled={loading} className="w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
        {error && error !== 'Passwords do not match' ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
        <p className="mt-2 text-center text-xs text-[#6B7280]">By creating an account you agree to our terms. This tool is for educational use only.</p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
