const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { Shield } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | register | otp | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await db.auth.loginViaEmailPassword(email, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await db.auth.register({ email, password });
      setMode('otp');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await db.auth.verifyOtp({ email, otpCode });
      db.auth.setToken(res.access_token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid code.');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await db.auth.resetPasswordRequest(email);
      setSuccess('If this email is registered, a reset link has been sent.');
    } catch { setSuccess('If this email is registered, a reset link has been sent.'); }
    finally { setLoading(false); }
  };

  const fromUrl = encodeURIComponent('/');

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--parchment-light)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--ink-dark)' }}>
              <Shield size={32} style={{ color: 'var(--parchment-dark)' }} />
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--ink-dark)', fontWeight: 900 }}>
            D&D Character Forge
          </div>
          <div style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {mode === 'login' && 'Sign in to save your characters'}
            {mode === 'register' && 'Create your account'}
            {mode === 'otp' && 'Check your email for a verification code'}
            {mode === 'forgot' && 'Reset your password'}
          </div>
        </div>

        <div className="parchment-box p-6">
          {/* Social Logins */}
          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-2 mb-4">
              {['google', 'facebook', 'microsoft', 'apple'].map(provider => (
                <button
                  key={provider}
                  type="button"
                  className="w-full py-2 px-4 rounded text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'var(--parchment-mid)',
                    border: '1.5px solid var(--parchment-dark)',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--ink-dark)',
                    textTransform: 'capitalize',
                  }}
                  onClick={() => db.auth.loginWithProvider(provider, '/')}
                >
                  Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </button>
              ))}
              <div className="ornament-divider mt-3 mb-3">
                <span className="ornament-divider-icon text-xs px-2" style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-body)' }}>or</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 rounded text-sm" style={{ background: 'rgba(139,26,26,0.1)', border: '1px solid var(--ink-red)', color: 'var(--ink-red)', fontFamily: 'var(--font-body)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 rounded text-sm" style={{ background: 'rgba(45,106,45,0.1)', border: '1px solid #2d6a2d', color: '#2d6a2d', fontFamily: 'var(--font-body)' }}>
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <div className="sheet-label">Email</div>
                <input type="email" required className="parchment-input text-sm" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <div className="sheet-label">Password</div>
                <input type="password" required className="parchment-input text-sm" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <button type="submit" disabled={loading} className="scroll-btn w-full text-sm">{loading ? 'Signing in...' : 'Sign In'}</button>
              <div className="flex justify-between text-xs mt-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
                <button type="button" onClick={() => { setMode('forgot'); setError(''); }}>Forgot password?</button>
                <button type="button" onClick={() => { setMode('register'); setError(''); }}>Create account</button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <div className="sheet-label">Email</div>
                <input type="email" required className="parchment-input text-sm" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div>
                <div className="sheet-label">Password</div>
                <input type="password" required className="parchment-input text-sm" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div>
                <div className="sheet-label">Confirm Password</div>
                <input type="password" required className="parchment-input text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <button type="submit" disabled={loading} className="scroll-btn w-full text-sm">{loading ? 'Creating...' : 'Create Account'}</button>
              <button type="button" className="w-full text-xs mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }} onClick={() => { setMode('login'); setError(''); }}>
                Already have an account? Sign in
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleOtp} className="space-y-3">
              <div>
                <div className="sheet-label">Verification Code</div>
                <input type="text" required className="parchment-input text-sm text-center tracking-widest" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" maxLength={6} />
              </div>
              <button type="submit" disabled={loading} className="scroll-btn w-full text-sm">{loading ? 'Verifying...' : 'Verify Email'}</button>
              <button type="button" className="w-full text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }} onClick={async () => { await db.auth.resendOtp(email); }}>
                Resend code
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-3">
              <div>
                <div className="sheet-label">Email</div>
                <input type="email" required className="parchment-input text-sm" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="scroll-btn w-full text-sm">{loading ? 'Sending...' : 'Send Reset Link'}</button>
              <button type="button" className="w-full text-xs mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                Back to sign in
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-mid)' }}>
            Continue without signing in →
          </a>
        </div>
      </div>
    </div>
  );
}