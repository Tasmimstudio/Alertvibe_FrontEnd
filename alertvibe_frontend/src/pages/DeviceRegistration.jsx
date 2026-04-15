// pages/DeviceRegistration.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motorcycleApi } from '../services/api';

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

function DeviceRegistration() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isActivated, setIsActivated] = useState(true);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => { fetchMotorcycles(); }, [currentUser]);

  const fetchMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await motorcycleApi.list();
      setMotorcycles(data.motorcycles || []);
      if (data.motorcycles?.length > 0) {
        const first = data.motorcycles[0];
        setSelectedMotorcycle(first);
        setIsActivated(first.isActivated !== false);
        setCurrentStatus(first.location || '');
      }
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

  const handleActivate = async () => {
    if (!selectedMotorcycle) return;
    try {
      await motorcycleApi.toggleActivation(selectedMotorcycle.id, true);
      setIsActivated(true);
      alert('Motorcycle security system activated!');
      fetchMotorcycles();
    } catch (error) { alert('Failed to activate: ' + error.message); }
  };

  const handleDeactivate = async () => {
    if (!selectedMotorcycle) return;
    try {
      await motorcycleApi.toggleActivation(selectedMotorcycle.id, false);
      setIsActivated(false);
      alert('Motorcycle security system deactivated!');
      fetchMotorcycles();
    } catch (error) { alert('Failed to deactivate: ' + error.message); }
  };

  const handleEdit = (motorcycle) => navigate(`/register?edit=${motorcycle.id}`);
  const handleAdd = () => navigate('/register');

  const handleDelete = async (motorcycle) => {
    if (confirm(`Delete motorcycle ${motorcycle.plateNumber}?`)) {
      try {
        await motorcycleApi.delete(motorcycle.id);
        alert('Motorcycle deleted!');
        fetchMotorcycles();
      } catch (error) { alert('Failed to delete: ' + error.message); }
    }
  };

  const handleStatus = (motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    setIsActivated(motorcycle.isActivated !== false);
    setCurrentStatus(motorcycle.location || '');
  };

  const handlePhotoClick = (motorcycleId) => {
    setUploadingPhotoId(motorcycleId);
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingPhotoId) return;
    if (file.size > 5 * 1024 * 1024) { alert('Photo must be less than 5MB'); return; }
    try {
      await motorcycleApi.uploadPhoto(uploadingPhotoId, file);
      alert('Photo uploaded!');
      fetchMotorcycles();
    } catch (error) { alert('Failed to upload photo: ' + error.message); }
    finally { setUploadingPhotoId(null); e.target.value = ''; }
  };

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">
      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />

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
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
             style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
          {initials}
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 p-5 flex flex-col gap-1"
               style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Navigation</p>
          <button onClick={() => navigate('/')} className="sb-btn"><HomeIcon /> Home</button>
          <button onClick={() => navigate('/devices')} className="sb-btn sb-active"><BikeIcon /> Manage Motorcycles</button>
          <button onClick={() => navigate('/history')} className="sb-btn"><BellIcon /> Full Alert Log</button>
          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout"><LogoutIcon /> Log Out</button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 min-w-0">
          <div className="glass h-full p-6 flex flex-col gap-5">

            {/* Page title */}
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Registered Motorcycles</h2>
              <button onClick={handleAdd} className="btn-red text-sm px-4 py-2">+ Add Motorcycle</button>
            </div>

            {/* Status control */}
            {selectedMotorcycle && (
              <div className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                   style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex-1">
                  <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">
                    Selected: {selectedMotorcycle.plateNumber}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${isActivated ? 'badge-green' : 'badge-red'}`}>
                      {isActivated ? 'Active' : 'Inactive'}
                    </span>
                    {currentStatus && (
                      <span className="text-white/50 text-xs">{currentStatus}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleActivate}
                    disabled={isActivated}
                    className="px-5 py-2 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                  >
                    Activate
                  </button>
                  <button
                    onClick={handleDeactivate}
                    disabled={!isActivated}
                    className="px-5 py-2 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="av-spinner" />
                <p className="text-white/40 text-sm">Loading motorcycles…</p>
              </div>
            ) : motorcycles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="text-5xl">🏍️</span>
                <p className="text-white/50 text-sm">No motorcycles registered yet.</p>
                <button onClick={handleAdd} className="btn-red text-sm px-5 py-2">Register First Motorcycle</button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Plate Number</th>
                      <th>Model</th>
                      <th>Color</th>
                      <th>Device Code</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {motorcycles.map((moto) => (
                      <tr
                        key={moto.id}
                        className={selectedMotorcycle?.id === moto.id ? 'ring-inset' : ''}
                        style={selectedMotorcycle?.id === moto.id ? { outline: '2px solid rgba(99,102,241,0.5)' } : {}}
                      >
                        <td>
                          <div
                            onClick={() => handlePhotoClick(moto.id)}
                            className="w-11 h-11 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:opacity-80"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                            title="Click to upload photo"
                          >
                            {moto.photoURL ? (
                              <img src={moto.photoURL} alt="Motorcycle" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="font-bold text-white">{moto.plateNumber}</td>
                        <td>{moto.model}</td>
                        <td>{moto.color}</td>
                        <td><span className="badge badge-blue">{moto.deviceCode}</span></td>
                        <td>
                          <div className="flex justify-center gap-1.5">
                            <button onClick={() => handleEdit(moto)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
                              style={{ background: 'rgba(99,102,241,0.7)' }}>Edit</button>
                            <button onClick={() => handleStatus(moto)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
                              style={{ background: 'rgba(245,158,11,0.7)' }}>Status</button>
                            <button onClick={() => handleDelete(moto)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
                              style={{ background: 'rgba(239,68,68,0.7)' }}>Delete</button>
                          </div>
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
}

export default DeviceRegistration;
