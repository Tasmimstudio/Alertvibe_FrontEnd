// pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Feature = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
      {icon}
    </span>
    <span className="text-white/60 text-sm">{text}</span>
  </div>
);

const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const EyeOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const { login, currentUser, userProfile } = useAuth();
  const emailRef = useRef(null);

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [forgotMsg, setForgotMsg] = useState(false);
  const [shake, setShake]         = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (currentUser && userProfile) {
      const role = userProfile.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'security') navigate('/security');
      else navigate('/');
    }
  }, [currentUser, userProfile]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setForgotMsg(false);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait and try again.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact your admin.');
      } else {
        setError('Sign in failed. Check your credentials and try again.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared form JSX ─────────────────────────── */
  const FormBody = ({ mobile = false }) => (
    <div className={`relative z-10 w-full ${mobile ? 'max-w-[420px]' : 'max-w-[400px]'}`}
         style={{ animation: 'loginFadeIn 0.4s ease both' }}>

      <div className="mb-8">
        <h2 className="text-white font-black tracking-wide" style={{ fontSize: '1.65rem' }}>Welcome back</h2>
        <p className="text-white/40 text-sm mt-1.5">Sign in to access your dashboard</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl"
             style={{
               background: 'rgba(220,38,38,0.12)',
               border: '1px solid rgba(220,38,38,0.35)',
               animation: shake ? 'loginShake 0.45s ease' : 'none',
             }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"
               strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
          <p className="text-red-300 text-sm font-medium leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">Email Address</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input
              ref={mobile ? undefined : emailRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="av-input pl-11"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wider">Password</label>
            <button type="button" onClick={() => setForgotMsg(f => !f)}
              className="text-[11px] text-red-400/80 hover:text-red-400 transition-colors font-medium">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="av-input pl-11 pr-12"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}>
              {showPass ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
          {forgotMsg && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-1"
                 style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <p className="text-amber-400/90 text-[11px] leading-tight">
                Please contact your administrator to reset your password.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? 'rgba(220,38,38,0.6)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(220,38,38,0.45)',
            }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Signing in…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            )}
          </button>
          <p className="text-white/25 text-[10px] text-center mt-2.5">
            Redirected to the correct dashboard based on your role
          </p>
        </div>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)'}}/>
        <span className="text-white/20 text-[10px] uppercase tracking-widest">or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)'}}/>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-white/35 text-center">
          New to AlertVibe?{' '}
          <button onClick={() => navigate('/register')}
            className="text-red-400 hover:text-red-300 font-semibold transition-colors underline underline-offset-2">
            Create an account
          </button>
        </p>
        <button onClick={() => navigate('/admin-setup')}
          className="text-[11px] text-white/18 hover:text-white/40 transition-colors">
          First time setup → Create Admin Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex overflow-hidden" style={{ height: '100dvh', background: '#080e18' }}>

      {/* ── LEFT — Branding (desktop only) ─────────── */}
      <div className="hidden lg:flex w-[44%] flex-shrink-0 flex-col relative overflow-hidden">

        {/* Deep maroon gradient */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(160deg, #0a0520 0%, #150832 50%, #0d0628 100%)' }}/>

        {/* Radial red glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 50% 52%, rgba(124,58,237,0.28) 0%, transparent 62%)' }}/>

        {/* Right-edge separator */}
        <div className="absolute right-0 inset-y-0 w-px pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent 5%, rgba(139,92,246,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 95%)' }}/>

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* University top */}
          <div>
            <p className="text-white/70 text-sm font-bold tracking-[0.1em] uppercase leading-relaxed text-center">
              AlertVibe: Motorcycle Alert System with Push Notification for MSU-TCTO
            </p>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">

            {/* Logo mark */}
            <div className="flex flex-col items-center gap-5">
              <div className="av-logo" style={{ width: 260, height: 260, borderRadius: '50%' }}>
                <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
              </div>

              <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase">
                MSU-TCTO
              </p>

              <div className="flex items-center gap-2.5">
                <div className="h-px w-10" style={{ background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.7))' }}/>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.9)' }}/>
                <div className="h-px w-10" style={{ background: 'linear-gradient(to left, transparent, rgba(139,92,246,0.7))' }}/>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-white/45 text-sm leading-relaxed max-w-[230px]">
              Intelligent ESP32-powered theft detection with real-time Firebase alerts
            </p>

            {/* Features */}
            <div className="flex flex-col gap-3 w-full max-w-[255px] text-left">
              <Feature text="Real-time vibration detection"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
              />
              <Feature text="Firebase push notifications"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
              />
              <Feature text="Role-based access control"
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              />
            </div>
          </div>

          {/* Bottom */}
          <p className="text-white/25 text-[9.5px] tracking-[0.18em] uppercase text-center">
            Institute of Information Communication Technology
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto relative login-scroll"
           style={{ background: '#080810' }}>

        {/* Motorcycle photo background */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: 'url(/login-bg.png)',
               backgroundSize: 'contain',
               backgroundRepeat: 'no-repeat',
               backgroundPosition: 'center 52%',
             }}/>

        {/* Dark overlay so form text stays readable */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(160deg, rgba(8,8,20,0.82) 0%, rgba(10,10,24,0.78) 100%)' }}/>

        <div className="absolute inset-0 pointer-events-none av-grid-bg opacity-30"/>

        {/* Mobile branding */}
        <div className="lg:hidden flex flex-col items-center mb-8 relative z-10">
          <div className="av-logo mb-2" style={{ width: 180, height: 180, borderRadius: '50%' }}>
            <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
          </div>
          <p className="text-white/38 text-xs mt-1 tracking-wider">MSU-TCTO Security System</p>
        </div>

        {FormBody({})}
      </div>

      <style>{`
        .login-scroll::-webkit-scrollbar { display: none; }
        .login-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          15%  { transform: translateX(-6px); }
          30%  { transform: translateX(6px); }
          45%  { transform: translateX(-4px); }
          60%  { transform: translateX(4px); }
          75%  { transform: translateX(-2px); }
          90%  { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}

export default Login;
