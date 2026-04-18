// pages/SecurityAlertLog.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';

const Logo = () => (
  <div className="av-logo">
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
      <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
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
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
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
          plateNumber: m.plateNumber || '',
        };
      });

      const formattedAlerts = (alertsData.alerts || []).map(alert => {
        const ts = alert.timestamp?._seconds
          ? new Date(alert.timestamp._seconds * 1000)
          : alert.timestamp ? new Date(alert.timestamp) : new Date();
        const respondedAt = alert.respondedAt?._seconds
          ? new Date(alert.respondedAt._seconds * 1000)
          : alert.respondedAt ? new Date(alert.respondedAt) : null;
        const ownerInfo = deviceMap[alert.deviceId] || {};
        return {
          id: alert.id,
          date: ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          time: ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          timestamp: ts,
          motorcycle: alert.deviceId || 'Unknown',
          message: alert.message || 'VIBRATION DETECTED',
          severity: alert.severity || 'medium',
          isResponded: alert.responded || false,
          respondedBy: alert.respondedBy || null,
          respondedAt: respondedAt
            ? respondedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
            : null,
          notes: alert.notes || '',
          ownerName: ownerInfo.ownerName || 'Unknown',
          ownerPhone: ownerInfo.ownerPhone || null,
          ownerEmail: ownerInfo.ownerEmail || null,
          plateNumber: ownerInfo.plateNumber || '',
        };
      });
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
    const action = markAs ? 'MARK this alert as RESPONDED' : 'UNDO response';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
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
              respondedAt: markAs
                ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                : null,
              notes: markAs ? responseNotes : '',
            }
          : a
      ));
      handleCloseModal();
    } catch (error) {
      window.alert('Failed to update alert: ' + error.message);
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

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || currentUser?.displayName?.charAt(0)?.toUpperCase() || 'S';

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
              <span className="w-2 h-2 rounded-full bg-amber-400" style={{ boxShadow: '0 0 0 3px rgba(251,191,36,0.25)' }} />
              <span className="text-amber-400 text-xs font-semibold tracking-wider">SECURITY ACCESS</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-white text-sm font-semibold">{userProfile?.displayName || currentUser?.email || 'Security'}</p>
            <p className="text-amber-400 text-xs font-semibold">Security</p>
          </div>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Profile"
                 className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                 style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }}>
              {initials}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 p-5 flex flex-col gap-1"
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
          </button>
          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout"><LogoutIcon /> Log Out</button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 min-w-0">
          <div className="glass h-full p-6 flex flex-col gap-5">

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
                  onChange={(e) => setSearchPlate(e.target.value)}
                  placeholder="Search by device ID or plate…"
                  className="av-input pl-9"
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
                    onClick={() => setFilter(f.key)}
                    className={`tab-pill flex items-center gap-1.5 py-2 ${filter === f.key ? 'tab-active' : ''}`}
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
                <span className="text-5xl">✅</span>
                <p className="text-white/50 text-sm">No alerts found.</p>
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
                    {filteredAlerts.map((alertItem) => (
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
                               className="badge badge-green hover:opacity-80 transition-opacity">
                              📞 Call
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
          </div>
        </main>
      </div>

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
              <div className="rounded-xl p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-2">Owner Contact</p>
                <p className="text-white font-bold mb-2">{selectedAlert.ownerName}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAlert.ownerPhone ? (
                    <a href={`tel:${selectedAlert.ownerPhone}`}
                       className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-all"
                       style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                      📞 Call {selectedAlert.ownerPhone}
                    </a>
                  ) : <span className="text-white/30 text-sm">No phone number</span>}
                  {selectedAlert.ownerEmail && (
                    <a href={`mailto:${selectedAlert.ownerEmail}`}
                       className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-80 transition-all"
                       style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                      ✉️ Email
                    </a>
                  )}
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
                    className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:opacity-80"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    {responding ? 'Undoing…' : 'Undo Response'}
                  </button>
                )}
                <button onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl font-bold text-white/60 transition-all hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityAlertLog;
