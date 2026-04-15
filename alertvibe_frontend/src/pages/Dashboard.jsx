import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi, motorcycleApi } from '../services/api';
import { onMessageListener } from '../services/NotificationService';

/* ── Icons ──────────────────────────────────────── */
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const BikeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
    <path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/>
  </svg>
);
const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ── Shared Logo ────────────────────────────────── */
const Logo = () => (
  <div className="av-logo">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
      <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('lastAlert');
  const [alerts, setAlerts] = useState([]);
  const [motorcycleInfo, setMotorcycleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupMessageListener();
    fetchData();
  }, [currentUser]);

  const setupMessageListener = () => {
    onMessageListener()
      .then((payload) => {
        const newAlert = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          message: payload.notification?.body || 'New alert received',
        };
        setAlerts((prev) => [newAlert, ...prev]);
      })
      .catch((err) => console.error('Failed to receive message:', err));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const alertsData = await alertApi.listAlerts();
      const formattedAlerts = (Array.isArray(alertsData) ? alertsData : []).map(alert => ({
        id: alert.id,
        date: alert.timestamp
          ? new Date(alert.timestamp._seconds ? alert.timestamp._seconds * 1000 : alert.timestamp)
              .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
          : 'N/A',
        message: alert.message || 'Vibration detected',
        deviceId: alert.deviceId,
        severity: alert.severity,
      }));
      setAlerts(formattedAlerts);

      if (currentUser) {
        const motorcyclesData = await motorcycleApi.list({ ownerId: currentUser.uid });
        if (motorcyclesData.motorcycles?.length > 0) {
          const m = motorcyclesData.motorcycles[0];
          setMotorcycleInfo({
            plateNumber: m.plateNumber || 'N/A',
            model: m.model || 'N/A',
            color: m.color || 'N/A',
            deviceCode: m.deviceCode || 'N/A',
            department: m.department || 'N/A',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U';
  const displayName = userProfile?.displayName || 'User';

  const severityColor = (s) => {
    if (s === 'high') return '#ef4444';
    if (s === 'medium') return '#f59e0b';
    return '#60a5fa';
  };

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">

      {/* ── Header ───────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-lg font-black tracking-widest text-white leading-tight">ALERTVIBE</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
              <span className="text-green-400 text-xs font-semibold tracking-wider">CONNECTED</span>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-white text-sm font-semibold">{displayName}</p>
            <p className="text-white/40 text-xs capitalize">{userProfile?.role || 'user'}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
               style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
            {initials}
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className="w-56 flex-shrink-0 p-5 flex flex-col gap-1"
               style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Navigation</p>

          <button onClick={() => navigate('/')} className="sb-btn sb-active">
            <HomeIcon /> Home
          </button>
          <button onClick={() => navigate('/devices')} className="sb-btn">
            <BikeIcon /> Manage Motorcycles
          </button>
          <button onClick={() => navigate('/history')} className="sb-btn">
            <BellIcon /> Full Alert Log
          </button>

          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout">
            <LogoutIcon /> Log Out
          </button>
        </aside>

        {/* ── Main ─────────────────────────────────── */}
        <main className="flex-1 p-6 flex flex-col min-w-0">

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {[
              { key: 'lastAlert', label: 'Last Alert' },
              { key: 'motorcycleInfo', label: 'Motorcycle Info' },
              { key: 'alertHistory', label: 'Alert History' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`tab-pill ${activeTab === t.key ? 'tab-active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="glass flex-1 p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="av-spinner" />
                <p className="text-white/40 text-sm">Loading data…</p>
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
                                : alert.severity === 'medium' ? 'badge-yellow'
                                : 'badge-blue'
                            }`}>
                              {alert.severity}
                            </span>
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
                          { label: 'Model', value: motorcycleInfo.model },
                          { label: 'Color', value: motorcycleInfo.color },
                          { label: 'Device Code', value: motorcycleInfo.deviceCode },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl p-4"
                               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
                            <p className="text-white font-bold text-lg">{value}</p>
                          </div>
                        ))}
                        <div className="col-span-2 rounded-xl p-4"
                             style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Department</p>
                          <p className="text-white font-bold text-lg">{motorcycleInfo.department}</p>
                        </div>
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
