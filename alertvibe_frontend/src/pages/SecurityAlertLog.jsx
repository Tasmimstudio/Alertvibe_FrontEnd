// pages/SecurityAlertLog.jsx (Mark Alert as Responded)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';

const SEVERITY_CONFIG = {
  high: { label: 'HIGH', bg: '#fee2e2', text: '#dc2626', border: '#dc2626' },
  medium: { label: 'MEDIUM', bg: '#fef3c7', text: '#d97706', border: '#d97706' },
  low: { label: 'LOW', bg: '#dcfce7', text: '#16a34a', border: '#16a34a' },
};

// #1 — Moved outside component to avoid re-creation on every render
function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium;
  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-bold"
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

function SecurityAlertLog() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchPlate, setSearchPlate] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unresponded' | 'responded'
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsData, motorcyclesData] = await Promise.all([
        securityApi.getAlerts(),
        securityApi.getMotorcyclesWithOwners()
      ]);

      const motorcycleList = motorcyclesData.motorcycles || [];
      setMotorcycles(motorcycleList);

      // Build a lookup map: deviceCode -> motorcycle owner info
      const deviceMap = {};
      motorcycleList.forEach(m => {
        if (m.deviceCode) {
          deviceMap[m.deviceCode] = {
            ownerName: m.ownerName || 'Unknown',
            ownerPhone: m.ownerPhone || null,
            ownerEmail: m.ownerEmail || null,
            plateNumber: m.plateNumber || '',
          };
        }
      });

      const formattedAlerts = (alertsData.alerts || []).map(alert => {
        const timestamp = alert.timestamp?._seconds
          ? new Date(alert.timestamp._seconds * 1000)
          : alert.timestamp
            ? new Date(alert.timestamp)
            : new Date();

        const respondedAt = alert.respondedAt?._seconds
          ? new Date(alert.respondedAt._seconds * 1000)
          : alert.respondedAt
            ? new Date(alert.respondedAt)
            : null;

        const ownerInfo = deviceMap[alert.deviceId] || {};

        return {
          id: alert.id,
          date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          time: timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          timestamp,
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
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearch = () => {
    if (!searchPlate.trim()) {
      fetchData();
    }
  };

  const handleRowClick = (alertItem) => {
    setSelectedAlert(alertItem);
    setResponseNotes(alertItem.notes || '');
  };

  const handleCloseModal = () => {
    setSelectedAlert(null);
    setResponseNotes('');
  };

  // #3 — Confirm before marking responded, #4 — supports both respond and un-respond
  const handleToggleResponded = async (markAs) => {
    if (!selectedAlert) return;

    const action = markAs ? 'MARK this alert as RESPONDED' : 'UNDO response and mark this alert as UNRESPONDED';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    setResponding(true);
    try {
      await securityApi.respondToAlert(selectedAlert.id, {
        responded: markAs,
        notes: markAs ? responseNotes : '',
        respondedBy: markAs
          ? (currentUser?.displayName || currentUser?.email || 'Security Guard')
          : null,
      });
      // Update local state
      setAlerts(prev =>
        prev.map(a =>
          a.id === selectedAlert.id
            ? {
                ...a,
                isResponded: markAs,
                respondedBy: markAs
                  ? (currentUser?.displayName || currentUser?.email || 'Security Guard')
                  : null,
                respondedAt: markAs
                  ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                  : null,
                notes: markAs ? responseNotes : '',
              }
            : a
        )
      );
      handleCloseModal();
    } catch (error) {
      console.error('Error responding to alert:', error);
      window.alert('Failed to update alert: ' + error.message);
    } finally {
      setResponding(false);
    }
  };

  // #8 — Sort unresponded first, then by timestamp descending
  // #7 — Compute filter counts for badges
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
      return (
        a.motorcycle.toLowerCase().includes(q) ||
        a.plateNumber.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Unresponded first
      if (a.isResponded !== b.isResponded) return a.isResponded ? 1 : -1;
      // Then newest first
      return b.timestamp - a.timestamp;
    });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-xl">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#dc2626' }}>
                A<span className="text-gray-700">/</span>V
              </div>
              <div className="text-[8px] font-semibold text-yellow-600 mt-0.5">
                ALERT VIBE
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">WELCOME TO ALERTVIBE</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ANNE MORALES"
              className="px-6 py-2 rounded bg-white text-gray-800 font-semibold text-center"
              style={{ width: '250px' }}
            />
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 p-6 space-y-4">
          <button
            onClick={() => navigate('/security')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
          >
            Registered Motorcycles
          </button>
          <button
            onClick={() => navigate('/security')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
          >
            View Motorcycle Owners
          </button>
          <button
            onClick={() => navigate('/security/alerts')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 transition-all shadow-md"
            style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            }}
          >
            Mark Alert as Responded
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
          >
            Log out
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-xl p-6">
            {/* Search + Filter Section */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={handleSearch}
                className="px-8 py-2 rounded font-bold text-white transition-all hover:scale-105"
                style={{ background: '#dc2626' }}
              >
                SEARCH
              </button>
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                placeholder="DEVICE ID / PLATE NO."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded text-gray-700 font-semibold"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              {/* #7 — Filter Buttons with count badges */}
              <div className="flex gap-1 ml-auto">
                {[
                  { key: 'all', label: 'ALL', count: alerts.length },
                  { key: 'unresponded', label: 'UNRESPONDED', count: unrespondedCount },
                  { key: 'responded', label: 'RESPONDED', count: respondedCount },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="px-4 py-2 rounded font-bold text-sm transition-all flex items-center gap-1.5"
                    style={{
                      background: filter === f.key ? '#1e3a5f' : '#e5e7eb',
                      color: filter === f.key ? '#ffffff' : '#374151',
                    }}
                  >
                    {f.label}
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: filter === f.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading alerts...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No alerts found.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#fbbf24' }}>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">SEVERITY</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">DATE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">TIME</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">DEVICE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">OWNER</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">PHONE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">MESSAGE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">STATUS</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">RESPONDED BY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alertItem, index) => (
                      <tr
                        key={alertItem.id}
                        className="border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        style={{
                          background: alertItem.isResponded
                            ? (index % 2 === 0 ? '#f0fdf4' : '#dcfce7')
                            : (index % 2 === 0 ? '#ffffff' : '#fef3c7')
                        }}
                        onClick={() => handleRowClick(alertItem)}
                      >
                        <td className="px-4 py-3">
                          <SeverityBadge severity={alertItem.severity} />
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">{alertItem.date}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">{alertItem.time}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">{alertItem.motorcycle}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">{alertItem.ownerName}</td>
                        <td className="px-4 py-3 text-sm">
                          {alertItem.ownerPhone ? (
                            <a
                              href={`tel:${alertItem.ownerPhone}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              CALL
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium text-sm">{alertItem.message}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{
                              background: alertItem.isResponded ? '#dcfce7' : '#fee2e2',
                              color: alertItem.isResponded ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {alertItem.isResponded ? 'RESPONDED' : 'UNRESPONDED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {alertItem.respondedBy ? (
                            <div>
                              <div className="font-medium text-gray-700">{alertItem.respondedBy}</div>
                              {alertItem.respondedAt && (
                                <div className="text-gray-400">{alertItem.respondedAt}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Response Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: '#1e3a5f' }}
            >
              <h2 className="text-lg font-bold text-white">Alert Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:text-gray-300 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Alert Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Date & Time</div>
                  <div className="text-gray-800 font-medium">{selectedAlert.date} {selectedAlert.time}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Severity</div>
                  <SeverityBadge severity={selectedAlert.severity} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Device ID</div>
                  <div className="text-gray-800 font-medium">{selectedAlert.motorcycle}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-bold">Plate Number</div>
                  <div className="text-gray-800 font-medium">{selectedAlert.plateNumber || 'N/A'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase font-bold">Message</div>
                <div className="text-gray-800 font-medium">{selectedAlert.message}</div>
              </div>

              {/* Owner Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase font-bold mb-2">Owner Contact</div>
                <div className="space-y-1">
                  <div className="text-gray-800 font-semibold">{selectedAlert.ownerName}</div>
                  {selectedAlert.ownerPhone ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedAlert.ownerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                        style={{ background: '#16a34a' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        CALL {selectedAlert.ownerPhone}
                      </a>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No phone number available</div>
                  )}
                  {selectedAlert.ownerEmail && (
                    <div>
                      <a
                        href={`mailto:${selectedAlert.ownerEmail}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {selectedAlert.ownerEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* #4 — Response status with UNDO button if already responded */}
              {selectedAlert.isResponded && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-xs text-green-700 uppercase font-bold mb-1">Already Responded</div>
                  <div className="text-green-800 text-sm">
                    <span className="font-semibold">By:</span> {selectedAlert.respondedBy}
                    {selectedAlert.respondedAt && (
                      <span className="ml-2 text-green-600">({selectedAlert.respondedAt})</span>
                    )}
                  </div>
                  {selectedAlert.notes && (
                    <div className="mt-1 text-green-800 text-sm">
                      <span className="font-semibold">Notes:</span> {selectedAlert.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Response Notes Input — only for unresponded */}
              {!selectedAlert.isResponded && (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">
                    Response Notes
                  </label>
                  <textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Enter your response notes here..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons — #3 confirm + #4 undo */}
              <div className="flex gap-3 pt-2">
                {!selectedAlert.isResponded ? (
                  <button
                    onClick={() => handleToggleResponded(true)}
                    disabled={responding}
                    className="flex-1 px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#dc2626' }}
                  >
                    {responding ? 'SUBMITTING...' : 'MARK RESPONDED'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleResponded(false)}
                    disabled={responding}
                    className="flex-1 px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#d97706' }}
                  >
                    {responding ? 'UNDOING...' : 'UNDO RESPONSE'}
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
                >
                  CLOSE
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
