// pages/AlertHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi } from '../services/api';
import BottomNav from '../components/BottomNav';
import Pagination from '../components/Pagination';
import ThemeSwitch from '../components/ThemeSwitch';
import { formatDate } from '../utils/formatDate';

const PAGE_SIZE = 15;

const readKey = (uid) => `alertvibe:read:${uid}`;
const getReadIds = (uid) => {
  try {
    const stored = localStorage.getItem(readKey(uid));
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
};
const saveReadIds = (uid, ids) => {
  try { localStorage.setItem(readKey(uid), JSON.stringify([...ids])); } catch {}
};

const Logo = () => (
  <div className="av-logo">
    <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
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
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const AlertHistory = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await alertApi.listAlerts();
      const readIds = getReadIds(currentUser?.uid);
      const formattedAlerts = (Array.isArray(data) ? data : []).map(alert => ({
        id: alert.id,
        date: formatDate(alert.timestamp, 'date'),
        time: formatDate(alert.timestamp, 'time'),
        motorcycle: alert.deviceId || 'Unknown',
        message: alert.message || 'VIBRATION DETECTED',
        severity: alert.severity || 'light',
        isRead: alert.responded || readIds.has(alert.id),
        isResponded: alert.responded || false,
        respondedBy: alert.respondedBy || null,
        respondedAt: alert.respondedAt || null,
        notes: alert.notes || '',
        _raw: alert.timestamp,
      }));
      setAlerts(formattedAlerts);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const toggleReadStatus = (alertId) => {
    const readIds = getReadIds(currentUser?.uid);
    const updated = alerts.map(a => {
      if (a.id !== alertId) return a;
      const next = !a.isRead;
      if (next) readIds.add(alertId); else readIds.delete(alertId);
      return { ...a, isRead: next };
    });
    saveReadIds(currentUser?.uid, readIds);
    setAlerts(updated);
  };

  const markAllRead = () => {
    const readIds = getReadIds(currentUser?.uid);
    alerts.forEach(a => readIds.add(a.id));
    saveReadIds(currentUser?.uid, readIds);
    setAlerts(alerts.map(a => ({ ...a, isRead: true })));
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const handleDelete = async (alertId) => {
    setDeletingId(alertId);
    try {
      await alertApi.deleteAlert(alertId);
      const readIds = getReadIds(currentUser?.uid);
      readIds.delete(alertId);
      saveReadIds(currentUser?.uid, readIds);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`Delete all ${alerts.length} alert${alerts.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    setClearingAll(true);
    try {
      await Promise.all(alerts.map(a => alertApi.deleteAlert(a.id)));
      const readIds = getReadIds(currentUser?.uid);
      alerts.forEach(a => readIds.delete(a.id));
      saveReadIds(currentUser?.uid, readIds);
      setAlerts([]);
    } catch (err) {
      console.error('Clear all failed:', err);
    } finally {
      setClearingAll(false);
    }
  };

  const filtered = alerts.filter(a =>
    !searchQuery ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.motorcycle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (q) => { setSearchQuery(q); setPage(1); };

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="av-bg av-grid-bg h-screen overflow-hidden flex flex-col" style={{ minHeight: '100dvh' }}>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
             onClick={() => setSelectedAlert(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
               style={{ background: 'rgba(15,15,25,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
               onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Alert Details</h3>
              <button onClick={() => setSelectedAlert(null)}
                      className="text-white/40 hover:text-white transition-colors text-xl leading-none">✕</button>
            </div>

            {/* Alert info */}
            <div className="rounded-xl p-4 flex flex-col gap-2"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-blue">{selectedAlert.motorcycle}</span>
                <span className="text-white/40 text-xs">{selectedAlert.date} · {selectedAlert.time}</span>
              </div>
              <p className="text-white font-semibold text-sm">{selectedAlert.message}</p>
            </div>

            {/* Response section */}
            <div className="rounded-xl p-4 flex flex-col gap-3"
                 style={{
                   background: selectedAlert.isResponded ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)',
                   border: `1px solid ${selectedAlert.isResponded ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
                 }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedAlert.isResponded ? '✅' : '⏳'}</span>
                <span className={`font-bold text-sm ${selectedAlert.isResponded ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedAlert.isResponded ? 'Security Has Responded' : 'Awaiting Security Response'}
                </span>
              </div>

              {selectedAlert.isResponded && (
                <>
                  {selectedAlert.respondedBy && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Responded By</span>
                      <span className="text-white font-bold text-base">{selectedAlert.respondedBy}</span>
                    </div>
                  )}
                  {selectedAlert.notes && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Notes</span>
                      <p className="text-white/80 text-sm leading-relaxed italic">"{selectedAlert.notes}"</p>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
              <span className="text-green-400 text-xs font-semibold tracking-wider hidden sm:inline">CONNECTED</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search alerts…"
              className="av-input !pl-9 py-2 text-sm w-44 lg:w-56"
            />
          </div>
          <ThemeSwitch />
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{userProfile?.displayName || currentUser?.email || 'User'}</p>
            <p className="text-white/40 text-xs capitalize">{userProfile?.role || 'user'}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity flex-shrink-0" title="My Profile">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile"
                   className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                   style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                {initials}
              </div>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* Sidebar (desktop only) */}
        <aside className="hidden md:flex w-56 flex-shrink-0 p-5 flex-col gap-1"
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
        <main className="flex-1 p-4 sm:p-6 min-w-0 mobile-pb overflow-y-auto">
          <div className="glass h-full overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-lg">Alert Log</h2>
                <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-pulse" />
                  Live
                </span>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold text-white/50 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Mark all as read ({unreadCount})
                  </button>
                )}
                {alerts.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={clearingAll}
                    className="text-xs font-semibold text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-2 disabled:opacity-40"
                  >
                    {clearingAll ? 'Clearing…' : 'Delete all'}
                  </button>
                )}
                <span className="badge badge-blue">{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
              </div>
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
              <>
                {/* Mobile: card list */}
                <div className="sm:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {paged.map((alert) => (
                    <div key={alert.id} className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                         onClick={() => setSelectedAlert(alert)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="badge badge-blue">{alert.motorcycle}</span>
                          <span className={`badge ${
                            alert.severity === 'strong' ? 'badge-red'
                              : alert.severity === 'moderate' ? 'badge-yellow'
                              : 'badge-green'
                          }`}>{(alert.severity || 'light').toUpperCase()}</span>
                          <span className={`badge ${alert.isResponded ? 'badge-green' : 'badge-red'}`}>
                            {alert.isResponded ? '✓ Responded' : 'Pending'}
                          </span>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(alert.id); }}
                          disabled={deletingId === alert.id}
                          className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {deletingId === alert.id
                            ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <TrashIcon />}
                        </button>
                      </div>
                      <p className="text-white/90 text-sm leading-snug mb-2">{alert.message}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white/35 text-xs">{alert.date} · {alert.time}</span>
                        <label className="flex items-center gap-1.5 cursor-pointer" onClick={e => e.stopPropagation()}>
                          <span className={`badge text-xs ${alert.isRead ? 'badge-green' : 'badge-yellow'}`}>
                            {alert.isRead ? 'Read' : 'Unread'}
                          </span>
                          <input type="checkbox" checked={alert.isRead}
                                 onChange={() => toggleReadStatus(alert.id)}
                                 className="w-4 h-4 cursor-pointer accent-red-500" />
                        </label>
                      </div>
                      {alert.isResponded && alert.respondedBy && (
                        <p className="text-white/40 text-xs mt-1.5">👮 {alert.respondedBy}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full av-table">
                    <thead>
                      <tr>
                        <th className="text-left">Date</th>
                        <th className="text-left">Time</th>
                        <th className="text-left">Device</th>
                        <th className="text-left">Severity</th>
                        <th className="text-left">Message</th>
                        <th className="text-left">Response</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((alert) => (
                        <tr key={alert.id}
                            onClick={() => setSelectedAlert(alert)}
                            className="cursor-pointer hover:bg-white/5 transition-colors">
                          <td className="font-semibold">{alert.date}</td>
                          <td className="text-white/60">{alert.time}</td>
                          <td>
                            <span className="badge badge-blue">{alert.motorcycle}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              alert.severity === 'strong' ? 'badge-red'
                                : alert.severity === 'moderate' ? 'badge-yellow'
                                : 'badge-green'
                            }`}>{(alert.severity || 'light').toUpperCase()}</span>
                          </td>
                          <td>{alert.message}</td>
                          <td>
                            {alert.isResponded ? (
                              <div className="flex flex-col gap-1">
                                <span className="badge badge-green">✓ Responded</span>
                                {alert.respondedBy && (
                                  <span className="text-white font-semibold text-xs">by {alert.respondedBy}</span>
                                )}
                              </div>
                            ) : (
                              <span className="badge badge-red">Pending</span>
                            )}
                          </td>
                          <td className="text-center" onClick={e => e.stopPropagation()}>
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
                          <td className="text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                              disabled={deletingId === alert.id}
                              title="Delete alert"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            >
                              {deletingId === alert.id
                                ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <TrashIcon />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
            />
          </div>
        </main>
      </div>

      <BottomNav
        activeKey="alerts"
        items={[
          { key: 'home',   label: 'Home',        icon: <HomeIcon />, onClick: () => navigate('/') },
          { key: 'bikes',  label: 'Motorcycles',  icon: <BikeIcon />, onClick: () => navigate('/devices') },
          { key: 'alerts', label: 'Alerts',        icon: <BellIcon />, onClick: () => navigate('/history') },
          { key: 'logout', label: 'Logout', onClick: handleLogout,
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> },
        ]}
      />
    </div>
  );
};

export default AlertHistory;
