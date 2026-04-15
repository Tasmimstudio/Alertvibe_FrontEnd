// pages/AlertHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi } from '../services/api';

const Logo = () => (
  <div className="av-logo">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
      <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

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

const AlertHistory = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertApi.listAlerts();
      const formattedAlerts = (Array.isArray(data) ? data : []).map(alert => {
        const ts = alert.timestamp?._seconds
          ? new Date(alert.timestamp._seconds * 1000)
          : alert.timestamp ? new Date(alert.timestamp) : new Date();
        return {
          id: alert.id,
          date: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          time: ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          motorcycle: alert.deviceId || 'Unknown',
          message: alert.message || 'VIBRATION DETECTED',
          isRead: alert.responded || false,
        };
      });
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const toggleReadStatus = (alertId) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: !a.isRead } : a));
  };

  const filtered = alerts.filter(a =>
    !searchQuery ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.motorcycle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
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
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search alerts…"
              className="av-input pl-9 py-2 text-sm"
              style={{ width: 220 }}
            />
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
               style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
            {initials}
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 p-5 flex flex-col gap-1"
               style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Navigation</p>
          <button onClick={() => navigate('/')} className="sb-btn"><HomeIcon /> Home</button>
          <button onClick={() => navigate('/devices')} className="sb-btn"><BikeIcon /> Manage Motorcycles</button>
          <button onClick={() => navigate('/history')} className="sb-btn sb-active"><BellIcon /> Full Alert Log</button>
          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout"><LogoutIcon /> Log Out</button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 min-w-0">
          <div className="glass h-full overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-white font-bold text-lg">Alert Log</h2>
              <span className="badge badge-red">{filtered.length} alerts</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="av-spinner" />
                <p className="text-white/40 text-sm">Loading alerts…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">✅</span>
                <p className="text-white/50 text-sm">
                  {searchQuery ? 'No matching alerts.' : 'No alerts found. Your motorcycle is safe!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date</th>
                      <th className="text-left">Time</th>
                      <th className="text-left">Device</th>
                      <th className="text-left">Message</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((alert) => (
                      <tr key={alert.id}>
                        <td className="font-semibold">{alert.date}</td>
                        <td className="text-white/60">{alert.time}</td>
                        <td>
                          <span className="badge badge-blue">{alert.motorcycle}</span>
                        </td>
                        <td>{alert.message}</td>
                        <td className="text-center">
                          <label className="flex items-center justify-center gap-2 cursor-pointer">
                            <span className={`badge ${alert.isRead ? 'badge-green' : 'badge-red'}`}>
                              {alert.isRead ? 'Read' : 'Unread'}
                            </span>
                            <input
                              type="checkbox"
                              checked={alert.isRead}
                              onChange={() => toggleReadStatus(alert.id)}
                              className="w-4 h-4 cursor-pointer accent-red-500"
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AlertHistory;
