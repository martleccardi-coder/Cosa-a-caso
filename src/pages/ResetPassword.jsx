const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { Shield } from 'lucide-react';

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await db.auth.resetPassword({ resetToken, newPassword: password });
      setSuccess(true);
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--parchment-light)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Shield size={32} style={{ color: 'var(--parchment-dark)', margin: '0 auto 12px' }} />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--ink-dark)' }}>Reset Password</div>
        </div>
        <div className="parchment-box p-6">
          {success ? (
            <div className="text-center" style={{ fontFamily: 'var(--font-body)', color: '#2d6a2d' }}>
              Password reset! Redirecting to sign in...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="text-sm p-2 rounded" style={{ background: 'rgba(139,26,26,0.1)', color: 'var(--ink-red)' }}>{error}</div>}
              <div>
                <div className="sheet-label">New Password</div>
                <input type="password" required className="parchment-input text-sm" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <div className="sheet-label">Confirm Password</div>
                <input type="password" required className="parchment-input text-sm" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" disabled={loading} className="scroll-btn w-full text-sm">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}