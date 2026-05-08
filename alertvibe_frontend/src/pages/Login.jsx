// pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/* ── Feature bullet ──────────────────────────────── */
const Feature = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.12)' }}>
      {icon}
    </span>
    <span className="text-white/70 text-sm">{text}</span>
  </div>
);

/* ── Eye icons ───────────────────────────────────── */
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

/* ─────────────────────────────────────────────────── */
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
  const [formOpen, setFormOpen]   = useState(false);

  // On mobile the left panel is hidden so always open the form
  useEffect(() => {
    if (window.innerWidth < 1024) setFormOpen(true);
  }, []);

  // Auto-focus email when form slides open
  useEffect(() => {
    if (formOpen) setTimeout(() => emailRef.current?.focus(), 550);
  }, [formOpen]);

  // Redirect if already logged in
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
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
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

  return (
    <div className="av-bg flex items-stretch overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── LEFT PANEL (desktop only) ─────────────────── */}
      <div
        className="hidden lg:flex relative overflow-hidden flex-shrink-0"
        onClick={() => formOpen && setFormOpen(false)}
        style={{
          borderRight: formOpen ? '1px solid rgba(220,38,38,0.2)' : 'none',
          width: formOpen ? '42%' : '100%',
          transition: 'width 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: formOpen ? 'pointer' : 'default',
        }}>

        {/* Background image — zooms in when form opens */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: 'url(/login-bg.png)',
               backgroundSize: 'contain',
               backgroundRepeat: 'no-repeat',
               backgroundPosition: 'center',
               transform: formOpen ? 'scale(1.12)' : 'scale(1)',
               transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
             }}/>

        {/* Maroon tint overlay */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               background: formOpen
                 ? 'linear-gradient(160deg, rgba(100,0,0,0.65) 0%, rgba(70,0,0,0.75) 100%)'
                 : 'linear-gradient(160deg, rgba(128,0,0,0.45) 0%, rgba(90,0,0,0.55) 100%)',
               transition: 'background 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
             }}/>

        {/* Back arrow — shown when form is open */}
        <div
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5"
          style={{
            opacity: formOpen ? 1 : 0,
            transform: formOpen ? 'translateX(0)' : 'translateX(-8px)',
            transition: 'opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s',
            pointerEvents: 'none',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Back</span>
        </div>

        {/* All content */}
        <div className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-10">

          {/* University branding */}
          <div className="text-center">
            <p className="text-white/70 text-[11px] font-semibold tracking-[0.25em] uppercase mb-0.5">
              Mindanao State University
            </p>
            <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase">
              Tawi-Tawi College of Technology and Oceanography
            </p>
          </div>

          {/* Center content — Start button or feature list */}
          <div className="flex flex-col items-center gap-4 flex-1 justify-center">

            {/* Always-visible title */}
            <div className="flex flex-col items-center gap-2 mb-2">
              <h2 className="text-3xl font-black tracking-widest text-white drop-shadow-lg">ALERTVIBE</h2>
              <p className="text-white/60 text-[11px] tracking-widest uppercase">Security System</p>
              <div className="w-12 h-px mt-1" style={{ background: 'rgba(220,38,38,0.7)' }}/>
            </div>

            {/* START button — visible when form is closed */}
            <div style={{
              opacity: formOpen ? 0 : 1,
              transform: formOpen ? 'scale(0.85) translateY(10px)' : 'scale(1) translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.35s ease',
              pointerEvents: formOpen ? 'none' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <p className="text-white/65 text-sm text-center leading-relaxed max-w-[260px]">
                Your Intelligent Motorcycle Security System
              </p>

              <button
                onClick={() => setFormOpen(true)}
                className="relative flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base text-white tracking-widest uppercase"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                  boxShadow: '0 0 32px rgba(220,38,38,0.55), 0 4px 20px rgba(220,38,38,0.35)',
                }}
              >
                <span className="absolute inset-0 rounded-2xl" style={{ animation: 'startPulse 2s ease-out infinite' }}/>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/>
                </svg>
                Start
              </button>

              <p className="text-white/30 text-[10px] tracking-widest uppercase">Tap to sign in</p>
            </div>

            {/* Feature list — visible when form is open */}
            <div style={{
              opacity: formOpen ? 1 : 0,
              transform: formOpen ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.35s ease 0.25s, transform 0.35s ease 0.25s',
              pointerEvents: formOpen ? 'auto' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
            }}>
              <p className="text-white/65 text-sm text-center leading-relaxed max-w-[220px]">
                Your Intelligent Motorcycle Security System
              </p>
              <div className="flex flex-col gap-3 mt-1 w-full max-w-[240px]">
                <Feature text="Real-time vibration alerts"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
                />
                <Feature text="Firebase push notifications"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
                />
                <Feature text="ESP32 + SW-420 sensor"
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-[10px] text-center tracking-wider">
            Institute of Information Communication Technology
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ───────────────────────── */}
      <div
        style={{
          width: formOpen ? '58%' : '0',
          overflow: 'hidden',
          opacity: formOpen ? 1 : 0,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'linear-gradient(160deg, #0d1b2a 0%, #0c1628 60%, #0a1020 100%)',
          transition: 'width 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease 0.1s',
        }}
        className="lg:block hidden"
      >
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none av-grid-bg opacity-60"/>

        {/* Card */}
        <div className="relative z-10 w-full max-w-[400px] px-6 py-10"
             style={{ animation: formOpen ? 'loginFadeIn 0.4s ease 0.35s both' : 'none' }}>

          {/* Card header */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-black tracking-wide">Welcome back</h2>
            <p className="text-white/45 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          {/* Error banner */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/55 text-xs font-semibold uppercase tracking-wider px-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  ref={emailRef}
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
                <label className="text-white/55 text-xs font-semibold uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotMsg(f => !f)}
                  className="text-[11px] text-red-400/80 hover:text-red-400 transition-colors font-medium"
                >
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
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
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

            {/* Sign In button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: loading
                    ? 'rgba(220,38,38,0.6)'
                    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(220,38,38,0.45)',
                }}
              >
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

              <p className="text-white/25 text-[10px] text-center mt-2.5 leading-tight">
                You'll be redirected to the correct dashboard based on your role
              </p>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
            <span className="text-white/25 text-[10px] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
          </div>

          {/* Bottom links */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-white/35 text-center">
              New to AlertVibe?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-red-400 hover:text-red-300 font-semibold transition-colors underline underline-offset-2"
              >
                Create an account
              </button>
            </p>
            <button
              onClick={() => navigate('/admin-setup')}
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors"
            >
              First time setup → Create Admin Account
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE — always-visible form ─────────────── */}
      <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-6 py-10 relative overflow-y-auto login-noscroll"
           style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #0c1628 60%, #0a1020 100%)' }}>

        <div className="absolute inset-0 pointer-events-none av-grid-bg opacity-60"/>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="av-logo mb-3" style={{ width: 52, height: 52, borderRadius: 15 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white">ALERTVIBE</h1>
          <p className="text-white/40 text-xs mt-1 text-center">MSU-TCTO Motorcycle Security System</p>
        </div>

        <div className="relative z-10 w-full max-w-[400px]"
             style={{ animation: 'loginFadeIn 0.35s ease both' }}>

          <div className="mb-8">
            <h2 className="text-white text-2xl font-black tracking-wide">Welcome back</h2>
            <p className="text-white/45 text-sm mt-1">Sign in to access your dashboard</p>
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
            <div className="flex flex-col gap-1.5">
              <label className="text-white/55 text-xs font-semibold uppercase tracking-wider px-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="av-input pl-11" placeholder="you@example.com"
                  autoComplete="email" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-white/55 text-xs font-semibold uppercase tracking-wider">Password</label>
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
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="av-input pl-11 pr-12" placeholder="Enter your password"
                  autoComplete="current-password" required />
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
                  <p className="text-amber-400/90 text-[11px] leading-tight">Please contact your administrator to reset your password.</p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading ? 'rgba(220,38,38,0.6)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(220,38,38,0.45)',
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
              <p className="text-white/25 text-[10px] text-center mt-2.5 leading-tight">
                You'll be redirected to the correct dashboard based on your role
              </p>
            </div>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
            <span className="text-white/25 text-[10px] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}/>
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
              className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
              First time setup → Create Admin Account
            </button>
          </div>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        .login-noscroll::-webkit-scrollbar { display: none; }
        .login-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(16px); }
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
        @keyframes startPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.6); }
          70%  { box-shadow: 0 0 0 18px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}

export default Login;
