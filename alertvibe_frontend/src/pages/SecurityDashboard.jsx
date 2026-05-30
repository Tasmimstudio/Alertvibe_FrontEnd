// pages/SecurityDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';
import BottomNav from '../components/BottomNav';
import ThemeSwitch from '../components/ThemeSwitch';
import PhotoViewer from '../components/PhotoViewer';

const Logo = () => (
  <div className="av-logo">
    <img src="/alertvibe-logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
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
  const [viewPhoto, setViewPhoto] = useState(null);
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
    <>
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">

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
                  className="av-input !pl-9"
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
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-3">
                  {filteredMotorcycles.map((m) => (
                    <div key={m.id} className="rounded-xl overflow-hidden cursor-pointer hover:bg-white/5 transition-colors"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                         onClick={() => setSelectedMotorcycle(m)}>
                      <div className="flex items-center gap-3 p-3">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                             style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          {m.ownerPhotoURL ? (
                            <img src={m.ownerPhotoURL} alt={m.owner} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                                 style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                              {m.owner?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-bold text-sm">{m.owner}</p>
                            <span className={`badge ${m.isActivated ? 'badge-green' : 'badge-red'}`}>
                              {m.isActivated ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-yellow">{m.plateNumber}</span>
                            <span className="badge badge-blue">{m.deviceCode}</span>
                          </div>
                          <p className="text-white/50 text-xs mt-1">{m.model} · {m.color}</p>
                          {m.ownerEmail && (
                            <a href={`mailto:${m.ownerEmail}`} onClick={e => e.stopPropagation()}
                               className="text-indigo-400 text-xs hover:text-indigo-300 block mt-0.5 truncate">
                              {m.ownerEmail}
                            </a>
                          )}
                        </div>
                        {m.ownerPhone && (
                          <a href={`tel:${m.ownerPhone}`} onClick={e => e.stopPropagation()}
                             className="flex-shrink-0 badge badge-blue hover:opacity-80 transition-opacity">
                            📞
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
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
                            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                              {m.ownerPhotoURL ? (
                                <img src={m.ownerPhotoURL} alt={m.owner} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                                     style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                                  {m.owner?.charAt(0)?.toUpperCase() || '?'}
                                </div>
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
                                 className="badge badge-blue hover:opacity-80 transition-opacity inline-flex items-center gap-1">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.82 19.79 19.79 0 010 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                                </svg>
                                {m.ownerPhone}
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
              </>
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
                <div className="w-full rounded-xl overflow-hidden cursor-zoom-in" style={{ maxHeight: 280 }}
                     onClick={() => setViewPhoto({ src: selectedMotorcycle.photoURL, alt: selectedMotorcycle.model })}>
                  <img src={selectedMotorcycle.photoURL} alt={selectedMotorcycle.model}
                       className="w-full h-full object-contain hover:scale-105 transition-transform duration-200" style={{ maxHeight: 280 }} />
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
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                {/* Full-width profile photo */}
                {selectedMotorcycle.ownerPhotoURL ? (
                  <img src={selectedMotorcycle.ownerPhotoURL} alt={selectedMotorcycle.owner}
                       className="w-full object-cover cursor-zoom-in hover:brightness-110 transition-all duration-200"
                       style={{ height: 220, borderBottom: '2px solid rgba(251,191,36,0.3)' }}
                       onClick={() => setViewPhoto({ src: selectedMotorcycle.ownerPhotoURL, alt: selectedMotorcycle.owner })} />
                ) : (
                  <div className="w-full flex items-center justify-center font-black text-white"
                       style={{ height: 220, fontSize: 80, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderBottom: '2px solid rgba(251,191,36,0.3)' }}>
                    {selectedMotorcycle.owner?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="p-4">
                  <p className="text-amber-400 text-xs uppercase tracking-wider font-bold mb-2">Owner Information</p>
                  <p className="text-white font-bold text-lg mb-3">{selectedMotorcycle.owner}</p>
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
                       className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                       style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.82 19.79 19.79 0 010 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                      Call
                    </a>
                  )}
                  {selectedMotorcycle.ownerEmail && (
                    <a href={`mailto:${selectedMotorcycle.ownerEmail}`}
                       className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                       style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                      ✉️ Email
                    </a>
                  )}
                  {!selectedMotorcycle.ownerPhone && !selectedMotorcycle.ownerEmail && (
                    <span className="text-white/30 text-sm">No contact info available</span>
                  )}
                </div>
                </div>
              </div>

              <button onClick={() => setSelectedMotorcycle(null)}
                      className="w-full py-1.5 rounded-xl font-bold text-white/60 transition-all hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    {viewPhoto && <PhotoViewer src={viewPhoto.src} alt={viewPhoto.alt} onClose={() => setViewPhoto(null)} />}
    </>
  );
}

export default SecurityDashboard;
