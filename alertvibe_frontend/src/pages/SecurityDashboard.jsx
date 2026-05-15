// pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';
import BottomNav from '../components/BottomNav';

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

function SecurityDashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [searchPlate, setSearchPlate] = useState('');
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [unrespondedCount, setUnrespondedCount] = useState(0);

  useEffect(() => { fetchMotorcycles(); fetchUnrespondedCount(); }, []);

  const fetchUnrespondedCount = async () => {
    try {
      const data = await securityApi.getAlerts();
      const count = (data.alerts || []).filter(a => !a.responded).length;
      setUnrespondedCount(count);
    } catch (error) {
      console.error('Error fetching alert count:', error);
    }
  };

  const fetchMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await securityApi.getMotorcyclesWithOwners();
      setMotorcycles((data.motorcycles || []).map(m => ({
        id: m.id,
        owner: m.ownerName || 'Unknown',
        plateNumber: m.plateNumber || '',
        model: m.model || '',
        color: m.color || '',
        deviceCode: m.deviceCode || '',
        department: m.department || null,
        photoURL: m.photoURL || null,
        ownerPhotoURL: m.ownerPhotoURL || null,
        ownerPhone: m.ownerPhone || null,
        ownerEmail: m.ownerEmail || null,
        status: m.status || 'active',
        isActivated: m.isActivated !== false,
        parkingLocation: m.parkingLocation || null,
        parkingNote: m.parkingNote || null,
        parkingNoteUpdatedAt: m.parkingNoteUpdatedAt || null,
        createdAt: m.createdAt || null,
      })));
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const filteredMotorcycles = searchPlate.trim()
    ? motorcycles.filter(m =>
        m.plateNumber.toLowerCase().includes(searchPlate.toLowerCase()) ||
        m.owner.toLowerCase().includes(searchPlate.toLowerCase()) ||
        m.deviceCode.toLowerCase().includes(searchPlate.toLowerCase())
      )
    : motorcycles;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return 'N/A'; }
  };

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || currentUser?.displayName?.charAt(0)?.toUpperCase() || 'S';

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
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
          <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity flex-shrink-0" title="My Profile">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile"
                   className="w-9 h-9 rounded-full object-cover"
                   style={{ boxShadow: '0 2px 8px rgba(245,158,11,0.4)' }} />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
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
          <button onClick={() => navigate('/security')} className="sb-btn sb-active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
              <path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/>
            </svg>
            Registered Motorcycles
          </button>
          <button onClick={() => navigate('/security/alerts')} className="sb-btn">
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
        <main className="flex-1 p-4 sm:p-6 min-w-0 mobile-pb">
          <div className="glass h-full p-6 flex flex-col gap-5">

            {/* Search */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  placeholder="Search by plate, owner, or device code…"
                  className="av-input pl-9"
                />
              </div>
              <span className="badge badge-yellow">{filteredMotorcycles.length} motorcycles</span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="av-spinner" />
                <p className="text-white/40 text-sm">Loading motorcycles…</p>
              </div>
            ) : filteredMotorcycles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-5xl">🏍️</span>
                <p className="text-white/50 text-sm">No motorcycles found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Owner</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Plate</th>
                      <th>Model</th>
                      <th>Color</th>
                      <th>Device Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMotorcycles.map((m) => (
                      <tr key={m.id} className="cursor-pointer" onClick={() => setSelectedMotorcycle(m)}>
                        <td>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                               style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            {m.photoURL ? (
                              <img src={m.photoURL} alt="Motorcycle" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="font-semibold text-white">{m.owner}</td>
                        <td>
                          {m.ownerEmail ? (
                            <a href={`mailto:${m.ownerEmail}`} onClick={(e) => e.stopPropagation()}
                               className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">
                              {m.ownerEmail}
                            </a>
                          ) : <span className="text-white/25 text-xs">N/A</span>}
                        </td>
                        <td>
                          {m.ownerPhone ? (
                            <a href={`tel:${m.ownerPhone}`} onClick={(e) => e.stopPropagation()}
                               className="badge badge-blue hover:opacity-80 transition-opacity">
                              📞 {m.ownerPhone}
                            </a>
                          ) : <span className="text-white/25 text-xs">N/A</span>}
                        </td>
                        <td><span className="badge badge-yellow">{m.plateNumber}</span></td>
                        <td>{m.model}</td>
                        <td>{m.color}</td>
                        <td><span className="badge badge-blue">{m.deviceCode}</span></td>
                        <td>
                          <span className={`badge ${m.isActivated ? 'badge-green' : 'badge-red'}`}>
                            {m.isActivated ? 'Active' : 'Inactive'}
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

      {/* Mobile bottom nav */}
      <BottomNav
        activeKey="bikes"
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

      {/* Detail Modal */}
      {selectedMotorcycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={() => setSelectedMotorcycle(null)}>
          <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto"
               style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
               onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 className="text-white font-bold text-lg">Motorcycle Details</h2>
              <button onClick={() => setSelectedMotorcycle(null)}
                      className="text-white/40 hover:text-white/80 text-2xl leading-none transition-colors">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo */}
              {selectedMotorcycle.photoURL ? (
                <div className="w-full rounded-xl overflow-hidden" style={{ maxHeight: 280 }}>
                  <img src={selectedMotorcycle.photoURL} alt={selectedMotorcycle.model}
                       className="w-full h-full object-contain" style={{ maxHeight: 280 }} />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl flex flex-col items-center justify-center gap-2"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  <span className="text-4xl">🏍️</span>
                  <p className="text-white/30 text-sm">No photo available</p>
                </div>
              )}

              {/* Plate + status */}
              <div className="flex items-center gap-3">
                <span className="badge badge-yellow text-base px-4 py-1.5">{selectedMotorcycle.plateNumber}</span>
                <span className={`badge ${selectedMotorcycle.isActivated ? 'badge-green' : 'badge-red'}`}>
                  {selectedMotorcycle.isActivated ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Model', value: selectedMotorcycle.model },
                  { label: 'Color', value: selectedMotorcycle.color },
                  { label: 'Device Code', value: selectedMotorcycle.deviceCode },
                  { label: 'Department', value: selectedMotorcycle.department || 'N/A' },
                  { label: 'Registered', value: formatDate(selectedMotorcycle.createdAt), span: 2 },
                ].map(({ label, value, span }) => (
                  <div key={label} className={`rounded-xl p-3 ${span === 2 ? 'col-span-2' : ''}`}
                       style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
                    <p className="text-white font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Parking Note */}
              <div className="rounded-xl p-4"
                   style={selectedMotorcycle.parkingNote
                     ? { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)' }
                     : { background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-indigo-400 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    Parking Note
                  </p>
                  {selectedMotorcycle.parkingNoteUpdatedAt && (
                    <span className="text-white/30 text-xs">{formatDate(selectedMotorcycle.parkingNoteUpdatedAt)}</span>
                  )}
                </div>
                {selectedMotorcycle.parkingNote ? (
                  <p className="text-white/85 text-sm leading-relaxed">{selectedMotorcycle.parkingNote}</p>
                ) : (
                  <p className="text-white/30 text-sm italic">No parking note set by owner.</p>
                )}
              </div>

              {/* Owner contact */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-3">Owner Information</p>
                <div className="flex items-center gap-3 mb-3">
                  {selectedMotorcycle.ownerPhotoURL ? (
                    <img src={selectedMotorcycle.ownerPhotoURL} alt={selectedMotorcycle.owner}
                         className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                         style={{ border: '2px solid rgba(251,191,36,0.4)' }} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                      {selectedMotorcycle.owner?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <p className="text-white font-bold text-lg">{selectedMotorcycle.owner}</p>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40 w-12 flex-shrink-0">Email</span>
                    {selectedMotorcycle.ownerEmail
                      ? <span className="text-indigo-300 font-medium">{selectedMotorcycle.ownerEmail}</span>
                      : <span className="text-white/25 italic">Not provided</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/40 w-12 flex-shrink-0">Phone</span>
                    {selectedMotorcycle.ownerPhone
                      ? <span className="text-white font-medium">{selectedMotorcycle.ownerPhone}</span>
                      : <span className="text-white/25 italic">Not provided</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMotorcycle.ownerPhone && (
                    <a href={`tel:${selectedMotorcycle.ownerPhone}`}
                       className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                       style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                      📞 Call
                    </a>
                  )}
                  {selectedMotorcycle.ownerEmail && (
                    <a href={`mailto:${selectedMotorcycle.ownerEmail}`}
                       className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                       style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                      ✉️ Email
                    </a>
                  )}
                  {!selectedMotorcycle.ownerPhone && !selectedMotorcycle.ownerEmail && (
                    <span className="text-white/30 text-sm">No contact info available</span>
                  )}
                </div>
              </div>

              <button onClick={() => setSelectedMotorcycle(null)}
                      className="w-full py-3 rounded-xl font-bold text-white/60 transition-all hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
