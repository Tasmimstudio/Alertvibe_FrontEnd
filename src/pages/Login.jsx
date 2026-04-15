// pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (currentUser && userProfile) redirectBasedOnRole(userProfile.role);
  }, [currentUser, userProfile]);

  const redirectBasedOnRole = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'security') navigate('/security');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please try again.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact your admin.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="av-bg av-grid-bg min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="float-shape1 absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
      <div className="float-shape2 absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }} />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full opacity-5"
           style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

      {/* Login card */}
      <div className="glass relative z-10 w-full max-w-md mx-6 px-8 py-10"
           style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="av-logo mb-4" style={{ width: 64, height: 64, borderRadius: 18 }}>
            {/* Shield icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
                    fill="white" fillOpacity="0.9" />
              <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-widest text-white">ALERTVIBE</h1>
          <p className="text-sm text-white/50 mt-1 tracking-wide">Smart Motorcycle Security System</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 font-medium"
               style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="av-input pl-10"
              placeholder="Email address"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <input
              type={showPass ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="av-input pl-10 pr-12"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => alert('Please contact admin for password reset')}
              className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
            >
              Forgot Password?
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-red flex-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Log In'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn-cyan flex-1"
            >
              Register
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Admin setup */}
        <div className="text-center">
          <button
            onClick={() => navigate('/admin-setup')}
            className="text-xs text-white/35 hover:text-white/55 transition-colors"
          >
            First time? Setup Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
