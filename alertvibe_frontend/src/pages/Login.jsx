// pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const [remember, setRemember]   = useState(false);
  const [modal, setModal]         = useState(null); // 'howItWorks' | 'about' | null

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

  return (
    <div className="flex overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── LEFT — Branding ──────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] flex-shrink-0 flex-col relative overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #3b2882 0%, #4a359a 60%, #3d2d8e 100%)' }}>

        {/* Teal blob — top-left decorative (mimics 3D shell) */}
        <div className="absolute pointer-events-none" style={{
          top: -100, left: -100,
          width: 360, height: 360,
          borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%',
          background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 45%, #0891b2 80%, #0e7490 100%)',
        }}/>
        <div className="absolute pointer-events-none" style={{
          top: -50, left: -30,
          width: 220, height: 220,
          borderRadius: '42% 58% 68% 32% / 48% 52% 48% 52%',
          background: 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 50%, #06b6d4 100%)',
          opacity: 0.75,
        }}/>
        <div className="absolute pointer-events-none" style={{
          top: 30, left: 170,
          width: 130, height: 130,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)',
          filter: 'blur(18px)',
        }}/>
        {/* Bottom-right soft glow */}
        <div className="absolute pointer-events-none" style={{
          bottom: -60, right: -60,
          width: 280, height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}/>

        {/* Right separator */}
        <div className="absolute right-0 inset-y-0 w-px pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent 5%, rgba(139,92,246,0.35) 30%, rgba(139,92,246,0.35) 70%, transparent 95%)' }}/>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Spacer pushes everything down */}
          <div className="flex-1" />

          {/* Logo + name */}
          <div className="flex items-center gap-4 mb-5">
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)', padding: 4, flexShrink: 0 }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-white font-black text-2xl tracking-wide leading-none">AlertVibe™</p>
              <p className="text-white/45 text-xs mt-1 tracking-wider">MSU-TCTO</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-white font-bold leading-snug mb-8"
              style={{ fontSize: '1.45rem', maxWidth: 290 }}>
            Motorcycle Alert System with Real-time Push Notifications for MSU-TCTO
          </h2>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            <button className="login-outline-btn" onClick={() => setModal('howItWorks')}>How It Works?</button>
            <button className="login-outline-btn" onClick={() => setModal('about')}>About the System</button>
          </div>

          {/* Footer */}
          <p className="text-white/25 text-[10px] tracking-widest uppercase">
            Institute of Information Communication Technology
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form panel ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative overflow-y-auto login-scroll"
           style={{ background: 'linear-gradient(150deg, #5040aa 0%, #5e4db8 50%, #5040aa 100%)' }}>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}/>

        {/* ── Form card ── */}
        <div className="relative z-10 w-full bg-white rounded-2xl px-8 py-9"
             style={{
               maxWidth: 420,
               boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
               animation: 'loginFadeIn 0.4s ease both',
             }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden' }}>
              <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-gray-800">AlertVibe™</span>
          </div>

          <h2 className="font-black text-gray-800 mb-1" style={{ fontSize: '1.35rem' }}>
            Log In to AlertVibe™
          </h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to access your dashboard</p>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl"
                 style={{
                   background: 'rgba(220,38,38,0.07)',
                   border: '1.5px solid rgba(220,38,38,0.22)',
                   animation: shake ? 'loginShake 0.45s ease' : 'none',
                 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"
                   strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
              </svg>
              <p className="text-red-500 text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1.5">Your Email</label>
              <div className="relative">
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="login-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1.5">Your Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="login-input"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}>
                  {showPass ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* Remember + Forgotten */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                       className="w-3.5 h-3.5 rounded accent-violet-600" />
                <span className="text-gray-500 text-xs">Remember</span>
              </label>
              <button type="button" onClick={() => setForgotMsg(f => !f)}
                className="text-xs text-violet-500 hover:text-violet-700 font-semibold transition-colors">
                Forgotten?
              </button>
            </div>

            {/* Forgot hint */}
            {forgotMsg && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                   style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
                <p className="text-amber-600 text-[11px] leading-tight">
                  Please contact your administrator to reset your password.
                </p>
              </div>
            )}

            {/* Log In — teal */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl font-bold text-sm text-white tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(6,182,212,0.4)',
                }}>
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
            </div>
          </form>

          {/* Sign Up */}
          <p className="text-center text-gray-400 text-xs mt-5 mb-3">Don't have an account?</p>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 rounded-xl font-bold text-sm text-white tracking-wide transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
            Sign Up
          </button>

          <button onClick={() => navigate('/admin-setup')}
            className="block w-full text-center text-[10px] text-gray-300 hover:text-gray-500 transition-colors mt-5">
            First time setup → Create Admin Account
          </button>
        </div>
      </div>

      {/* ── How It Works Modal ── */}
      {modal === 'howItWorks' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
             onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
               style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'loginFadeIn 0.3s ease both' }}
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-7 py-5 flex items-center justify-between"
                 style={{ background: 'linear-gradient(135deg,#22d3ee,#0891b2)', }}>
              <h3 className="text-white font-black text-lg">How It Works?</h3>
              <button onClick={() => setModal(null)}
                      className="text-white/70 hover:text-white text-2xl leading-none transition-colors">&times;</button>
            </div>
            {/* Steps */}
            <div className="px-7 py-6 space-y-5">
              {[
                { step: '01', title: 'Sensor Detects Vibration', desc: 'The ESP8266 microcontroller paired with an SW-420 vibration sensor continuously monitors the motorcycle for unusual movement or tampering.', color: '#22d3ee' },
                { step: '02', title: 'Alert is Triggered',       desc: 'When vibration exceeds the threshold, the device immediately sends an alert payload (device ID, severity, timestamp) to the AlertVibe backend via Wi-Fi.', color: '#818cf8' },
                { step: '03', title: 'Push Notification Sent',   desc: 'The backend processes the alert, saves it to Firestore, and broadcasts a Firebase Cloud Messaging (FCM) push notification to the motorcycle owner and security personnel.', color: '#f472b6' },
                { step: '04', title: 'Security Responds',        desc: 'Security personnel view the alert on their dashboard, locate the motorcycle using the parking note, and mark the alert as responded with notes.', color: '#4ade80' },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                       style={{ background: color }}>
                    {step}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm mb-0.5">{title}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-7 pb-6">
              <button onClick={() => setModal(null)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#22d3ee,#0891b2)' }}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── About the System Modal ── */}
      {modal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
             onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
               style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4)', animation: 'loginFadeIn 0.3s ease both' }}
               onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-7 py-5 flex items-center justify-between"
                 style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
              <h3 className="text-white font-black text-lg">About the System</h3>
              <button onClick={() => setModal(null)}
                      className="text-white/70 hover:text-white text-2xl leading-none transition-colors">&times;</button>
            </div>
            {/* Info */}
            <div className="px-7 py-6 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                <span className="font-bold text-gray-800">AlertVibe</span> is a capstone project developed at the
                <span className="font-semibold"> Mindanao State University – Tawi-Tawi College of Technology and Oceanography (MSU-TCTO)</span>,
                under the Institute of Information Communication Technology (IICT).
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                It provides a real-time motorcycle anti-theft detection system using an ESP8266 microcontroller
                and SW-420 vibration sensor, with instant push notifications delivered through Firebase Cloud Messaging.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { label: 'Institution',   value: 'MSU-TCTO' },
                  { label: 'Department',    value: 'IICT' },
                  { label: 'Microcontroller', value: 'ESP8266' },
                  { label: 'Sensor',        value: 'SW-420 Vibration' },
                  { label: 'Notifications', value: 'Firebase FCM' },
                  { label: 'Database',      value: 'Cloud Firestore' },
                  { label: 'Location',      value: 'Sanga-sanga, Bongao, Tawi-Tawi' },
                  { label: 'System',        value: 'AlertVibe v1.0' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl px-4 py-3"
                       style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <p className="text-violet-400 text-[10px] uppercase tracking-wider font-bold mb-0.5">{label}</p>
                    <p className="text-gray-700 font-semibold text-xs">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-7 pb-6">
              <button onClick={() => setModal(null)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .login-outline-btn {
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(255,255,255,0.28);
          background: transparent;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .login-outline-btn:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }
        .login-input {
          width: 100%;
          padding: 11px 44px 11px 16px;
          border-radius: 12px;
          font-size: 14px;
          color: #1f2937;
          background: #f5f3ff;
          border: 1.5px solid #ede9fe;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .login-scroll::-webkit-scrollbar { display: none; }
        .login-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px); }
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
