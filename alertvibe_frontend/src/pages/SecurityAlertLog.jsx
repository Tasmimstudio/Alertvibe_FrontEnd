// pages/SecurityAlertLog.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/formatDate';
import ThemeSwitch from '../components/ThemeSwitch';
import PhotoViewer from '../components/PhotoViewer';

const PAGE_SIZE = 15;

const Logo = () => (
  <div className="av-logo">
    <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
  </div>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

function SeverityBadge({ severity }) {
  const map = {
    high: 'badge-red',
    medium: 'badge-yellow',
    low: 'badge-green',
  };
  return (
    <span className={`badge ${map[severity] || 'badge-blue'}`}>
      {severity?.toUpperCase() || 'MEDIUM'}
    </span>
  );
}

function SecurityAlertLog() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [searchPlate, setSearchPlate] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [alertsData, motorcyclesData] = await Promise.all([
        securityApi.getAlerts(),
        securityApi.getMotorcyclesWithOwners(),
      ]);
      const motorcycleList = motorcyclesData.motorcycles || [];
      const deviceMap = {};
      motorcycleList.forEach(m => {
        if (m.deviceCode) deviceMap[m.deviceCode] = {
          ownerName: m.ownerName || 'Unknown',
          ownerPhone: m.ownerPhone || null,
          ownerEmail: m.ownerEmail || null,
          ownerPhotoURL: m.ownerPhotoURL || null,
          plateNumber: m.plateNumber || '',
        };
      });

      const formattedAlerts = (alertsData.alerts || []).map(alert => {
        const ts = alert.timestamp?._seconds
          ? new Date(alert.timestamp._seconds * 1000)
          : alert.timestamp ? new Date(alert.timestamp) : new Date();
        const ownerInfo = deviceMap[alert.deviceId] || {};
        return {
          id: alert.id,
          date: formatDate(alert.timestamp, 'date'),
          time: formatDate(alert.timestamp, 'time'),
          timestamp: ts,
          motorcycle: alert.deviceId || 'Unknown',
          message: alert.message || 'VIBRATION DETECTED',
          severity: alert.severity || 'medium',
          isResponded: alert.responded || false,
          respondedBy: alert.respondedBy || null,
          respondedAt: alert.respondedAt
            ? formatDate(alert.respondedAt, 'datetime')
            : null,
          notes: alert.notes || '',
          ownerName: ownerInfo.ownerName || 'Unknown',
          ownerPhone: ownerInfo.ownerPhone || null,
          ownerEmail: ownerInfo.ownerEmail || null,
          ownerPhotoURL: ownerInfo.ownerPhotoURL || null,
          plateNumber: ownerInfo.plateNumber || '',
        };
      });
      setAlerts(formattedAlerts);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const handleRowClick = (alertItem) => {
    setSelectedAlert(alertItem);
    setResponseNotes(alertItem.notes || '');
  };

  const handleCloseModal = () => {
    setSelectedAlert(null);
    setResponseNotes('');
  };

  const handleToggleResponded = async (markAs) => {
    if (!selectedAlert) return;
    const action = markAs ? 'Mark this alert as responded?' : 'Undo this response?';
    const ok = await confirm(action, markAs ? 'Mark Responded' : 'Undo');
    if (!ok) return;
    setResponding(true);
    try {
      await securityApi.respondToAlert(selectedAlert.id, {
        responded: markAs,
        notes: markAs ? responseNotes : '',
        respondedBy: markAs ? (currentUser?.displayName || currentUser?.email || 'Security Guard') : null,
      });
      setAlerts(prev => prev.map(a =>
        a.id === selectedAlert.id
          ? {
              ...a,
              isResponded: markAs,
              respondedBy: markAs ? (currentUser?.displayName || currentUser?.email || 'Security Guard') : null,
              respondedAt: markAs ? formatDate(new Date(), 'datetime') : null,
              notes: markAs ? responseNotes : '',
            }
          : a
      ));
      toast(markAs ? 'Alert marked as responded.' : 'Response undone.', markAs ? 'success' : 'info');
      handleCloseModal();
    } catch (error) {
      toast('Failed to update alert: ' + error.message, 'error');
    } finally {
      setResponding(false);
    }
  };

  const unrespondedCount = alerts.filter(a => !a.isResponded).length;
  const respondedCount = alerts.filter(a => a.isResponded).length;

  const filteredAlerts = alerts
    .filter(a => {
      if (filter === 'unresponded') return !a.isResponded;
      if (filter === 'responded') return a.isResponded;
      return true;
    })
    .filter(a => {
      if (!searchPlate.trim()) return true;
      const q = searchPlate.toLowerCase();
      return a.motorcycle.toLowerCase().includes(q) || a.plateNumber.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isResponded !== b.isResponded) return a.isResponded ? 1 : -1;
      return b.timestamp - a.timestamp;
    });

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pagedAlerts = filteredAlerts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };
  const handleSearchChange = (q) => { setSearchPlate(q); setPage(1); };

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || currentUser?.displayName?.charAt(0)?.toUpperCase() || 'S';

  return (
    <>
    <div className="av-bg av-grid-bg h-screen overflow-hidden flex flex-col" style={{ minHeight: '100dvh' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" style={{ boxShadow: '0 0 0 3px rgba(251,191,36,0.25)' }} />
              <span className="text-amber-400 text-xs font-semibold tracking-wider hidden sm:inline">SECURITY ACCESS</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitch />
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{userProfile?.displayName || currentUser?.email || 'Security'}</p>
            <p className="text-amber-400 text-xs font-semibold">Security</p>
          </div>
          <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity flex-shrink-0" title="My Profile">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile"
                   className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                   style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }} />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white text-sm"
                   style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
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
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Security Panel</p>
          <button onClick={() => navigate('/security')} className="sb-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/>
            </svg>
            Registered Motorcycles
          </button>
          <button onClick={() => navigate('/security/alerts')} className="sb-btn sb-active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            Alert Responses
            {unrespondedCount > 0 && (
              <span className="ml-auto badge badge-red" style={{ fontSize: 10, padding: '2px 7px' }}>
                {unrespondedCount > 9 ? '9+' : unrespondedCount}
              </span>
            )}
          </button>
          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout"><LogoutIcon /> Log Out</button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 min-w-0 mobile-pb overflow-y-auto">
          <div className="glass h-full p-6 flex flex-col gap-5">

            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg">Security Alert Log</h2>
              <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 status-pulse" />
                Live
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchPlate}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by device ID or plate…"
                  className="av-input !pl-9"
                />
              </div>

              {/* Filter pills */}
              <div className="flex gap-1.5">
                {[
                  { key: 'all', label: 'All', count: alerts.length },
                  { key: 'unresponded', label: 'Unresponded', count: unrespondedCount },
                  { key: 'responded', label: 'Responded', count: respondedCount },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => handleFilterChange(f.key)}
                    className={`tab-pill flex items-center gap-1.5 ${filter === f.key ? 'tab-active' : ''}`}
                  >
                    {f.label}
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.15)' }}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="av-spinner" />
                <p className="text-white/40 text-sm">Loading alerts…</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-5xl">{searchPlate || filter !== 'all' ? '🔍' : '✅'}</span>
                <p className="text-white/50 text-sm">
                  {searchPlate
                    ? `No alerts matching "${searchPlate}".`
                    : filter !== 'all'
                      ? `No ${filter} alerts.`
                      : 'No alerts found. All clear!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Device</th>
                      <th>Owner</th>
                      <th>Phone</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAlerts.map((alertItem) => (
                      <tr key={alertItem.id} className="cursor-pointer"
                          onClick={() => handleRowClick(alertItem)}
                          style={!alertItem.isResponded ? { borderLeft: '3px solid rgba(239,68,68,0.5)' } : {}}>
                        <td><SeverityBadge severity={alertItem.severity} /></td>
                        <td className="text-white/60 text-sm">{alertItem.date}</td>
                        <td className="text-white/60 text-sm">{alertItem.time}</td>
                        <td><span className="badge badge-blue">{alertItem.motorcycle}</span></td>
                        <td className="font-semibold text-white">{alertItem.ownerName}</td>
                        <td>
                          {alertItem.ownerPhone ? (
                            <a href={`tel:${alertItem.ownerPhone}`} onClick={(e) => e.stopPropagation()}
                               className="badge badge-green hover:opacity-80 transition-opacity inline-flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.82 19.79 19.79 0 010 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                              </svg>
                              Call
                            </a>
                          ) : <span className="text-white/25 text-xs">N/A</span>}
                        </td>
                        <td className="max-w-xs truncate">{alertItem.message}</td>
                        <td>
                          <span className={`badge ${alertItem.isResponded ? 'badge-green' : 'badge-red'}`}>
                            {alertItem.isResponded ? 'Responded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={PAGE_SIZE}
              total={filteredAlerts.length}
            />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav
        activeKey="alerts"
        items={[
          { key: 'bikes',  label: 'Motorcycles', activeColor: '#f59e0b',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/></svg>,
            onClick: () => navigate('/security') },
          { key: 'alerts', label: 'Alerts', badge: unrespondedCount, activeColor: '#f59e0b',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
            onClick: () => navigate('/security/alerts') },
          { key: 'logout', label: 'Logout',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
            onClick: handleLogout },
        ]}
      />

      {/* Alert Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={handleCloseModal}>
          <div className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto"
               style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
               onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-white font-bold text-lg">Alert Details</h2>
              <button onClick={handleCloseModal}
                      className="text-white/40 hover:text-white/80 text-2xl leading-none transition-colors">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Date & Time', value: `${selectedAlert.date} ${selectedAlert.time}` },
                  { label: 'Severity', isComponent: <SeverityBadge severity={selectedAlert.severity} /> },
                  { label: 'Device ID', value: selectedAlert.motorcycle },
                  { label: 'Plate Number', value: selectedAlert.plateNumber || 'N/A' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-3"
                       style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                    {item.isComponent || <p className="text-white font-semibold text-sm">{item.value}</p>}
                  </div>
                ))}
              </div>

              {/* Message */}
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">Message</p>
                <p className="text-white text-sm">{selectedAlert.message}</p>
              </div>

              {/* Owner contact */}
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                {selectedAlert.ownerPhotoURL ? (
                  <img src={selectedAlert.ownerPhotoURL} alt={selectedAlert.ownerName}
                       className="w-full object-cover cursor-zoom-in hover:brightness-110 transition-all duration-200"
                       style={{ height: 220, borderBottom: '2px solid rgba(251,191,36,0.3)' }}
                       onClick={() => setViewPhoto({ src: selectedAlert.ownerPhotoURL, alt: selectedAlert.ownerName })} />
                ) : (
                  <div className="w-full flex items-center justify-center font-black text-white"
                       style={{ height: 220, fontSize: 80, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderBottom: '2px solid rgba(251,191,36,0.3)' }}>
                    {selectedAlert.ownerName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-2">Owner Information</p>
                  <p className="text-white font-bold text-lg mb-3">{selectedAlert.ownerName}</p>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/40 w-12 flex-shrink-0">Phone</span>
                      {selectedAlert.ownerPhone
                        ? <span className="text-white font-medium">{selectedAlert.ownerPhone}</span>
                        : <span className="text-white/25 italic">Not provided</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white/40 w-12 flex-shrink-0">Email</span>
                      {selectedAlert.ownerEmail
                        ? <span className="text-indigo-300 font-medium">{selectedAlert.ownerEmail}</span>
                        : <span className="text-white/25 italic">Not provided</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.ownerPhone ? (
                      <a href={`tel:${selectedAlert.ownerPhone}`}
                         className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-all"
                         style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.82 19.79 19.79 0 010 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                        Call
                      </a>
                    ) : <span className="text-white/30 text-sm">No phone number</span>}
                    {selectedAlert.ownerEmail && (
                      <a href={`mailto:${selectedAlert.ownerEmail}`}
                         className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-all"
                         style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                        ✉️ Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Already responded info */}
              {selectedAlert.isResponded && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="text-green-400 text-xs uppercase tracking-wider font-bold mb-1">Already Responded</p>
                  <p className="text-white/80 text-sm">
                    <span className="font-semibold">By:</span> {selectedAlert.respondedBy}
                    {selectedAlert.respondedAt && (
                      <span className="text-white/50 ml-2">({selectedAlert.respondedAt})</span>
                    )}
                  </p>
                  {selectedAlert.notes && (
                    <p className="text-white/70 text-sm mt-1"><span className="font-semibold">Notes:</span> {selectedAlert.notes}</p>
                  )}
                </div>
              )}

              {/* Response notes */}
              {!selectedAlert.isResponded && (
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-wider font-semibold mb-1.5">Response Notes</label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Enter your response notes…"
                    className="av-input resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {!selectedAlert.isResponded ? (
                  <button onClick={() => handleToggleResponded(true)} disabled={responding}
                    className="btn-red flex-1">
                    {responding ? 'Submitting…' : 'Mark Responded'}
                  </button>
                ) : (
                  <button onClick={() => handleToggleResponded(false)} disabled={responding}
                    className="flex-1 py-1.5 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:opacity-80"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {responding ? 'Undoing…' : 'Undo Response'}
                  </button>
                )}
                <button onClick={handleCloseModal}
                  className="px-5 py-1.5 rounded-xl font-bold text-white/60 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    {viewPhoto && <PhotoViewer src={viewPhoto.src} alt={viewPhoto.alt} onClose={() => setViewPhoto(null)} />}
    </>
  );
}

export default SecurityAlertLog;
