import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi, motorcycleApi } from '../services/api';
import { onMessageListener } from '../services/NotificationService';
import BottomNav from '../components/BottomNav';
import { formatDate } from '../utils/formatDate';

const pendingMotorcycleKey = (uid) => `alertvibe:pendingMotorcycle:${uid}`;

/* ── Icons ──────────────────────────────────────── */
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const BikeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/>
  </svg>
);
const BellIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const WifiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const Logo = () => (
  <div className="av-logo">
    <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
  </div>
);

/* ── Skeleton blocks ─────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="skeleton h-3 w-1/3 rounded" />
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-3 w-2/3 rounded" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('lastAlert');
  const [alerts, setAlerts] = useState([]);
  const [motorcycleInfo, setMotorcycleInfo] = useState(null);
  const [motorcycleId, setMotorcycleId] = useState(null);
  const [loading, setLoading] = useState(true);
  // 'checking' | 'connected' | 'disconnected'
  const [connStatus, setConnStatus] = useState('checking');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPass, setShowWifiPass] = useState(false);
  const [wifiSaving, setWifiSaving] = useState(false);
  const [wifiStatus, setWifiStatus] = useState(null);
  const [foregroundAlert, setForegroundAlert] = useState(null); // { title, body }

  useEffect(() => {
  if (!currentUser?.uid) return;

  setupMessageListener();
  fetchData();
}, [currentUser]);

  // Poll connection every 30 s
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => {
      motorcycleApi.list({ ownerId: currentUser.uid })
        .then(() => setConnStatus('connected'))
        .catch(() => setConnStatus('disconnected'));
    }, 30000);
    return () => clearInterval(id);
  }, [currentUser]);

  // Recursive listener — re-subscribes after every message so no notifications are missed
  const setupMessageListener = () => {
    onMessageListener()
      .then((payload) => {
        const newAlert = {
          id: Date.now(),
          date: formatDate(new Date(), 'date'),
          message: payload.notification?.body || 'New alert received',
          severity: payload.data?.severity || 'medium',
          isRead: false,
        };
        setAlerts(prev => [newAlert, ...prev]);

        // Show visible in-app banner
        setForegroundAlert({
          title: payload.notification?.title || 'AlertVibe Alert',
          body:  payload.notification?.body  || 'Vibration detected on your motorcycle!',
        });
        setTimeout(() => setForegroundAlert(null), 8000);

        setupMessageListener();
      })
      .catch(() => {
        setupMessageListener();
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const alertsData = await alertApi.listAlerts();
      const formattedAlerts = (Array.isArray(alertsData) ? alertsData : []).map(alert => ({
        id: alert.id,
        date: formatDate(alert.timestamp, 'date'),
        message: alert.message || 'Vibration detected',
        deviceId: alert.deviceId,
        severity: alert.severity,
        isRead: alert.responded || false,
      }));
      setAlerts(formattedAlerts);

      if (currentUser?.uid) {
        const pendingMotorcycle = localStorage.getItem(pendingMotorcycleKey(currentUser.uid));
        if (pendingMotorcycle) {
          await motorcycleApi.register(JSON.parse(pendingMotorcycle));
          localStorage.removeItem(pendingMotorcycleKey(currentUser.uid));
        }

        const motorcyclesData = await motorcycleApi.list({ ownerId: currentUser.uid });
        if (motorcyclesData.motorcycles?.length > 0) {
  const m = motorcyclesData.motorcycles[0];
  setMotorcycleId(m.id);
  setMotorcycleInfo({
    plateNumber: m.plateNumber || 'N/A',
    model: m.model || 'N/A',
    color: m.color || 'N/A',
    deviceCode: m.deviceCode || 'N/A',
    department: m.department || null,
    parkingLocation: m.parkingLocation || null,
  });
  if (m.wifiSsid) setWifiSsid(m.wifiSsid);
} else {
  setMotorcycleId(null);
  setMotorcycleInfo(null);
}
      }
      setConnStatus('connected');
    } catch {
      setConnStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const handleWifiSave = async (e) => {
    e.preventDefault();
    if (!motorcycleId || !wifiSsid.trim()) return;
    setWifiSaving(true);
    setWifiStatus(null);
    try {
      await motorcycleApi.updateWifi(motorcycleId, { ssid: wifiSsid.trim(), password: wifiPassword });
      setWifiStatus({ ok: true, msg: 'WiFi credentials saved! The device will apply them within 5 minutes or on next restart.' });
    } catch (err) {
      setWifiStatus({ ok: false, msg: err.message || 'Failed to save WiFi configuration.' });
    } finally {
      setWifiSaving(false);
    }
  };

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'User';
  const photoURL = userProfile?.photoURL || currentUser?.photoURL;
  const initials = displayName.charAt(0).toUpperCase();
  const unreadCount = alerts.filter(a => !a.isRead).length;

  const severityColor = (s) => {
    if (s === 'high') return '#ef4444';
    if (s === 'medium') return '#f59e0b';
    return '#60a5fa';
  };

  /* ── Connection status chip ── */
  const ConnChip = () => {
    if (connStatus === 'connected') return (
      <><span className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
        <span className="text-green-400 text-xs font-semibold tracking-wider">CONNECTED</span></>
    );
    if (connStatus === 'disconnected') return (
      <><span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.25)' }} />
        <span className="text-red-400 text-xs font-semibold tracking-wider">NOT CONNECTED</span></>
    );
    return (
      <><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-yellow-400 text-xs font-semibold tracking-wider">CHECKING…</span></>
    );
  };

  /* ── Vibration threshold data ── */
  const THRESHOLDS = [
    {
      level: 'Light', icon: '🟢', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', badge: 'badge-green',
      trigger: 'Minor environmental vibrations — wind, nearby movement, accidental contact.',
      action: 'Activity recorded. No push notification sent.',
    },
    {
      level: 'Moderate', icon: '🟡', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', badge: 'badge-yellow',
      trigger: 'Someone touches, slightly moves, or tampers with the motorcycle.',
      action: 'System flags as suspicious and sends a push notification to owner & security.',
    },
    {
      level: 'Strong', icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', badge: 'badge-red',
      trigger: 'Intense, continuous vibrations — forced movement or attempted theft.',
      action: 'Immediate push notification sent via Firebase to owner & security personnel.',
    },
  ];

  /* ── Mobile bottom-nav items ── */
  const navItems = [
    { key: 'home',   label: 'Home',       icon: <HomeIcon />,             onClick: () => navigate('/') },
    { key: 'bikes',  label: 'Motorcycles', icon: <BikeIcon />,             onClick: () => navigate('/devices') },
    { key: 'alerts', label: 'Alerts',      icon: <BellIcon />, badge: unreadCount, onClick: () => navigate('/history') },
    {
      key: 'logout', label: 'Logout',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="av-bg av-grid-bg h-screen overflow-hidden flex flex-col" style={{ minHeight: '100dvh' }}>

      {/* ── Foreground notification banner ── */}
      {foregroundAlert && (
        <div className="fixed top-4 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 px-4"
             style={{ animation: 'slideDown 0.3s ease' }}>
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3 shadow-2xl"
               style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(220,38,38,0.5)' }}>
            <span className="text-2xl flex-shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm leading-tight">{foregroundAlert.title}</p>
              <p className="text-red-100 text-xs mt-1 leading-snug">{foregroundAlert.body}</p>
            </div>
            <button onClick={() => setForegroundAlert(null)}
                    className="text-white/60 hover:text-white text-lg leading-none flex-shrink-0 transition-colors">&times;</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5"><ConnChip /></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-white text-sm font-semibold">{displayName}</p>
            <p className="text-white/40 text-xs capitalize">{userProfile?.role || 'user'}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity flex-shrink-0" title="My Profile">
            {photoURL ? (
              <img src={photoURL} alt="Profile"
                   className="w-10 h-10 rounded-full object-cover"
                   style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                {initials}
              </div>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar (desktop only) ── */}
        <aside className="hidden md:flex w-56 flex-shrink-0 p-5 flex-col gap-1"
               style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Navigation</p>

          <button onClick={() => navigate('/')} className="sb-btn sb-active">
            <HomeIcon /> Home
          </button>
          <button onClick={() => navigate('/devices')} className="sb-btn">
            <BikeIcon /> Manage Motorcycles
          </button>
          {/* Bell with unread badge */}
          <button onClick={() => navigate('/history')} className="sb-btn">
            <BellIcon size={16} />
            Full Alert Log
            {unreadCount > 0 && (
              <span className="ml-auto badge badge-red" style={{ fontSize: 10, padding: '2px 7px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout">
            <LogoutIcon /> Log Out
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col min-w-0 mobile-pb overflow-y-auto">

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { key: 'lastAlert',    label: 'Last Alert' },
              { key: 'motorcycleInfo', label: 'Motorcycle Info' },
              { key: 'alertHistory', label: 'Alert History' },
              { key: 'thresholds',   label: 'Alert Levels' },
              { key: 'wifiSetup',    label: 'WiFi Setup' },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className={`tab-pill ${activeTab === t.key ? 'tab-active' : ''}`}>
                {t.label}
                {t.key === 'alertHistory' && unreadCount > 0 && (
                  <span className="ml-1.5 badge badge-red" style={{ fontSize: 10, padding: '1px 6px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="glass flex-1 p-4 sm:p-6">
            {loading ? (
              /* ── Skeleton loader ── */
              <div className="space-y-3">
                <div className="skeleton h-5 w-40 rounded mb-4" />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <>
                {/* Last Alert */}
                {activeTab === 'lastAlert' && (
                  <div className="space-y-3">
                    <h2 className="text-white font-bold text-lg mb-4">Recent Alerts</h2>
                    {alerts.length > 0 ? alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="alert-card"
                           style={{ borderLeftColor: severityColor(alert.severity) }}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-white/90 text-sm leading-relaxed">{alert.message}</p>
                            <p className="text-white/35 text-xs mt-1">{alert.date}</p>
                          </div>
                          {alert.severity && (
                            <span className={`badge flex-shrink-0 ${
                              alert.severity === 'high' ? 'badge-red'
                                : alert.severity === 'medium' ? 'badge-yellow' : 'badge-blue'
                            }`}>{alert.severity}</span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <span className="text-4xl">✅</span>
                        <p className="text-white/50 text-sm">No alerts yet — your motorcycle is safe!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Motorcycle Info */}
                {activeTab === 'motorcycleInfo' && (
                  <div>
                    <h2 className="text-white font-bold text-lg mb-5">Registered Motorcycle</h2>
                    {motorcycleInfo ? (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Plate Number', value: motorcycleInfo.plateNumber },
                          { label: 'Model',        value: motorcycleInfo.model },
                          { label: 'Color',        value: motorcycleInfo.color },
                          { label: 'Device Code',  value: motorcycleInfo.deviceCode },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl p-4"
                               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
                            <p className="text-white font-bold text-lg">{value}</p>
                          </div>
                        ))}
                        {motorcycleInfo.department && (
                          <div className="col-span-2 rounded-xl p-4"
                               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Department</p>
                            <p className="text-white font-bold text-lg">{motorcycleInfo.department}</p>
                          </div>
                        )}
                        {motorcycleInfo.parkingLocation && (
                          <div className="col-span-2 rounded-xl p-4"
                               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Parking Location</p>
                            <p className="text-white font-bold text-lg">{motorcycleInfo.parkingLocation}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <span className="text-4xl">🏍️</span>
                        <p className="text-white/50 text-sm">No motorcycle registered yet.</p>
                        <button onClick={() => navigate('/devices')} className="btn-red text-sm px-5 py-2">
                          Register Motorcycle
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Alert History Preview */}
                {activeTab === 'alertHistory' && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-white font-bold text-lg">Recent History</h2>
                      <button onClick={() => navigate('/history')} className="text-red-400 hover:text-red-300 text-xs font-semibold transition-colors">
                        View all →
                      </button>
                    </div>
                    {alerts.length > 0 ? (
                      <div className="space-y-3">
                        {alerts.slice(0, 3).map((alert) => (
                          <div key={alert.id} className="alert-card">
                            <p className="text-white/85 text-sm">{alert.message}</p>
                            <p className="text-white/35 text-xs mt-1">{alert.date}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <span className="text-4xl">📋</span>
                        <p className="text-white/50 text-sm">No alert history available.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Vibration Thresholds */}
                {activeTab === 'thresholds' && (
                  <div>
                    <div className="mb-5">
                      <h2 className="text-white font-bold text-lg">Vibration Alert Levels</h2>
                      <p className="text-white/40 text-sm mt-1">
                        Three calibrated SW-420 sensor levels distinguish normal activity from security threats.
                      </p>
                    </div>
                    <div className="space-y-4">
                      {THRESHOLDS.map(t => (
                        <div key={t.level} className="rounded-xl p-5"
                             style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{t.icon}</span>
                            <span className={`badge ${t.badge} text-sm px-3 py-1`}>{t.level} Threshold</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Trigger</p>
                              <p className="text-white/80 text-sm">{t.trigger}</p>
                            </div>
                            <div>
                              <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Response</p>
                              <p className="text-white/80 text-sm">{t.action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Scale bar */}
                    <div className="mt-5 rounded-xl p-4"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-3">Detection Scale</p>
                      <div className="flex items-center h-6 rounded-full overflow-hidden">
                        <div className="flex-1 h-full flex items-center justify-center text-[10px] font-bold text-green-900"
                             style={{ background: 'linear-gradient(90deg,#4ade80,#86efac)' }}>LIGHT</div>
                        <div className="flex-1 h-full flex items-center justify-center text-[10px] font-bold text-amber-900"
                             style={{ background: 'linear-gradient(90deg,#fbbf24,#fde68a)' }}>MODERATE</div>
                        <div className="flex-1 h-full flex items-center justify-center text-[10px] font-bold text-red-100"
                             style={{ background: 'linear-gradient(90deg,#ef4444,#dc2626)' }}>STRONG</div>
                      </div>
                      <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
                        <span>No alert</span><span>Push notification</span><span>Immediate alert</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* WiFi Setup */}
                {activeTab === 'wifiSetup' && (
                  <div>
                    <div className="mb-5">
                      <h2 className="text-white font-bold text-lg">WiFi Setup</h2>
                      <p className="text-white/40 text-sm mt-1">
                        Configure the WiFi network your ESP32 device connects to. Changes apply within 5 minutes or on device restart.
                      </p>
                    </div>

                    {!motorcycleInfo ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <span className="text-4xl">📡</span>
                        <p className="text-white/50 text-sm">No motorcycle registered yet.</p>
                        <button onClick={() => navigate('/devices')} className="btn-red text-sm px-5 py-2">
                          Register Motorcycle
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Device ID</p>
                          <p className="text-white font-bold">{motorcycleInfo.deviceCode}</p>
                        </div>

                        <form onSubmit={handleWifiSave} className="space-y-3">
                          <div>
                            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
                              WiFi Network (SSID)
                            </label>
                            <input
                              type="text"
                              value={wifiSsid}
                              onChange={e => setWifiSsid(e.target.value)}
                              placeholder="Enter network name"
                              autoComplete="off"
                              className="w-full rounded-lg px-4 py-3 text-white text-sm outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                            />
                          </div>

                          <div>
                            <label className="text-white/40 text-xs uppercase tracking-wider font-semibold block mb-2">
                              WiFi Password
                            </label>
                            <div className="relative">
                              <input
                                type={showWifiPass ? 'text' : 'password'}
                                value={wifiPassword}
                                onChange={e => setWifiPassword(e.target.value)}
                                placeholder="Enter password"
                                autoComplete="new-password"
                                className="w-full rounded-lg px-4 py-3 text-white text-sm outline-none pr-12"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowWifiPass(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                              >
                                {showWifiPass ? <EyeOffIcon /> : <EyeIcon />}
                              </button>
                            </div>
                          </div>

                          {wifiStatus && (
                            <div className="rounded-lg px-4 py-3 text-sm"
                                 style={{
                                   background: wifiStatus.ok ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                                   border: `1px solid ${wifiStatus.ok ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                   color: wifiStatus.ok ? '#4ade80' : '#f87171',
                                 }}>
                              {wifiStatus.msg}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={wifiSaving || !wifiSsid.trim()}
                            className="btn-red w-full py-3 text-sm font-semibold"
                            style={{ opacity: (wifiSaving || !wifiSsid.trim()) ? 0.5 : 1 }}
                          >
                            {wifiSaving ? 'Saving…' : 'Save WiFi Configuration'}
                          </button>
                        </form>

                        <div className="rounded-xl p-4 text-sm"
                             style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <WifiIcon />
                            <p className="text-white/60 font-semibold text-xs uppercase tracking-wider">How it works</p>
                          </div>
                          <p className="text-white/40 text-xs leading-relaxed">
                            After saving, your ESP32 will fetch the new credentials the next time it checks in (every 5 minutes) and restart to connect to the new network.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <BottomNav items={navItems} activeKey="home" />
    </div>
  );
};

export default Dashboard;
