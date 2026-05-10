import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import { resendOTP, verifyOTP } from '../../api/auth.api';
import { saveSession } from '../../utils/authStorage';
import AuthLayout from './AuthLayout';

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const pendingEmail = useMemo(() => sessionStorage.getItem('stocklens_pending_email') || '', []);
  const inputRefs = useRef([]);
  const [email, setEmail] = useState(pendingEmail);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpCode = code.join('');

  const updateCode = (index, value) => {
    const next = [...code];
    next[index] = value.replace(/\D/g, '').slice(0, 1);
    setCode(next);

    if (next[index] && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP({ email, otp_code: otpCode });
      saveSession(response.data.token, response.data.user);
      setSuccess(true);
      setTimeout(() => navigate('/explorer'), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');

    try {
      await resendOTP({ email });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={(
        <>
          We sent a 6-digit code to<br /><span className="font-semibold text-[#F9FAFB]">{email || 'your email'}</span>
        </>
      )}
      footer={<Link to="/login" className="font-semibold text-[#10B981] hover:underline">Back to sign in</Link>}
    >
      {success ? (
        <div className="mt-8 text-center">
          <svg className="mx-auto h-14 w-14" viewBox="0 0 56 56" fill="none" aria-hidden="true">
            <circle cx="28" cy="28" r="24" stroke="#10B981" strokeWidth="3" />
            <path d="M17 29l7 7 15-17" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4 text-lg font-semibold text-[#10B981]">Email verified!</div>
          <p className="mt-1 text-sm text-[#9CA3AF]">Redirecting to your dashboard...</p>
          <div className="mx-auto mt-4 h-1 w-2/3 rounded-full bg-[#10B981]" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="mt-6 block">
            <span className="mb-1 block text-sm text-[#9CA3AF]">Email address</span>
            <input
              className="w-full rounded-lg border border-[#374151] bg-[#1F2937] px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <div className="mt-8 flex justify-center gap-3">
            {code.map((value, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                className="h-12 w-12 rounded-lg border border-[#374151] bg-[#1F2937] text-center font-mono text-xl text-[#F9FAFB] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                value={value}
                onChange={(event) => updateCode(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                maxLength="1"
                required
              />
            ))}
          </div>
          <div className="mt-3 text-center font-mono text-xs text-[#6B7280]">Code expires in 10 minutes</div>
          <button disabled={loading || otpCode.length !== 6} className="mt-6 w-full rounded-lg bg-[#10B981] py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          {error ? <p className="mt-3 text-center text-sm text-[#EF4444]">{error}</p> : null}
          <div className="mt-4 text-center text-sm text-[#9CA3AF]">
            Didn't receive the code? <button type="button" onClick={handleResend} className="text-[#10B981] hover:underline">Resend</button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default VerifyOTPPage;
