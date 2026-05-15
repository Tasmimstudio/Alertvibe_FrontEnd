// pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, userApi, motorcycleApi } from '../services/api';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import BottomNav from '../components/BottomNav';
import Pagination from '../components/Pagination';

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

const SB_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { key: 'addSecurity', label: 'Add Security', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  )},
  { key: 'users', label: 'View Users', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )},
  { key: 'alerts', label: 'Alert History', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  )},
  { key: 'models', label: 'Moto Models', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6h-3l-2 5.5M5.5 14L8 8.5h5.5L16 14"/>
    </svg>
  )},
  { key: 'settings', label: 'System Settings', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  )},
];

function StatCard({ title, value, children, accent }) {
  return (
    <div className="glass p-6" style={{ borderLeft: `3px solid ${accent}` }}>
      <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-1">{title}</p>
      <p className="text-4xl font-black text-white mb-3">{value}</p>
      {children}
    </div>
  );
}

function AlertTrend({ alerts }) {
  // Build last-7-days buckets
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toDateString(),
      count: 0,
    };
  });

  alerts.forEach((alert) => {
    const ts = alert.timestamp?._seconds
      ? new Date(alert.timestamp._seconds * 1000)
      : alert.timestamp ? new Date(alert.timestamp) : null;
    if (!ts) return;
    const bucket = days.find(d => d.date === ts.toDateString());
    if (bucket) bucket.count++;
  });

  const max = Math.max(...days.map(d => d.count), 1);
  const BAR_H = 80;

  return (
    <div className="glass p-6">
      <h3 className="text-white font-bold text-base mb-5">7-Day Alert Trend</h3>
      <div className="flex items-end gap-3 justify-around" style={{ height: BAR_H + 40 }}>
        {days.map((d, i) => {
          const h = Math.max(4, Math.round((d.count / max) * BAR_H));
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              {d.count > 0 && (
                <span className="text-white/60 text-[10px] font-bold">{d.count}</span>
              )}
              <div
                style={{
                  height: h,
                  width: '100%',
                  borderRadius: 5,
                  background: d.count === 0
                    ? 'rgba(255,255,255,0.07)'
                    : `linear-gradient(180deg, #ef4444 0%, #dc2626 100%)`,
                  boxShadow: d.count > 0 ? '0 2px 10px rgba(220,38,38,0.4)' : 'none',
                  transition: 'height 0.4s ease',
                  alignSelf: 'flex-end',
                }}
              />
              <span className="text-white/40 text-[10px] font-semibold">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usersPage, setUsersPage]   = useState(1);
  const [alertsPage, setAlertsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [securityForm, setSecurityForm] = useState({ email: '', password: '', displayName: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [modelSaving, setModelSaving] = useState(false);
  const [editingModelId, setEditingModelId] = useState(null);
  const [editingModelName, setEditingModelName] = useState('');
  const [pwModal, setPwModal] = useState(null); // { userId, displayName }
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return; }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'models') fetchModels();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardData, usersData, alertsData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getAllUsers(),
        adminApi.getAllAlerts(),
      ]);
      setStats(dashboardData);
      setUsers(usersData.users || []);
      setAlerts(alertsData.alerts || alertsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); }
    catch (error) { console.error('Error logging out:', error); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    // Optimistic update — no full re-fetch needed
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await adminApi.updateUserRole(userId, newRole);
      toast('User role updated.', 'success');
    } catch (error) {
      // Revert on failure
      fetchData();
      toast('Failed to update role: ' + error.message, 'error');
    }
  };

  const handleToggleStatus = async (userId, activate) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: activate } : u));
    try {
      await adminApi.toggleUserStatus(userId, activate);
      toast(`User ${activate ? 'activated' : 'deactivated'}.`, activate ? 'success' : 'warning');
    } catch (error) {
      fetchData();
      toast('Failed to update status: ' + error.message, 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) { toast('Password must be at least 6 characters.', 'warning'); return; }
    setSavingPw(true);
    try {
      await adminApi.resetUserPassword(pwModal.userId, newPw);
      toast(`Password updated for ${pwModal.displayName || 'user'}.`, 'success');
      setPwModal(null);
      setNewPw('');
    } catch (err) {
      toast('Failed to update password: ' + err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const ok = await confirm('Are you sure you want to delete this user? This cannot be undone.', 'Delete User');
    if (!ok) return;
    try {
      await adminApi.deleteUser(userId);
      fetchData();
      toast('User deleted successfully.', 'info');
    } catch (error) { toast('Failed to delete user: ' + error.message, 'error'); }
  };

  const handleAddSecurity = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await userApi.createWithRole({ ...securityForm, role: 'security' });
      toast('Security personnel added successfully!', 'success');
      setSecurityForm({ email: '', password: '', displayName: '' });
      fetchData();
    } catch (error) {
      setFormError(error.message || 'Failed to add security personnel');
    } finally {
      setFormLoading(false);
    }
  };

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const data = await motorcycleApi.listModels();
      setModels(data.modelList || []);
    } catch (err) {
      toast('Failed to load models: ' + err.message, 'error');
    } finally {
      setModelsLoading(false);
    }
  };

  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!newModelName.trim()) return;
    setModelSaving(true);
    try {
      const data = await motorcycleApi.addModel(newModelName.trim());
      setModels(prev => [...prev, data.model].sort((a, b) => a.name.localeCompare(b.name)));
      setNewModelName('');
      toast('Model added successfully.', 'success');
    } catch (err) {
      toast('Failed to add model: ' + err.message, 'error');
    } finally {
      setModelSaving(false);
    }
  };

  const handleUpdateModel = async (id) => {
    if (!editingModelName.trim()) return;
    try {
      await motorcycleApi.updateModel(id, editingModelName.trim());
      setModels(prev =>
        prev.map(m => m.id === id ? { ...m, name: editingModelName.trim() } : m)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingModelId(null);
      toast('Model updated.', 'success');
    } catch (err) {
      toast('Failed to update model: ' + err.message, 'error');
    }
  };

  const handleDeleteModel = async (id, name) => {
    const ok = await confirm(`Delete "${name}"? This cannot be undone.`, 'Delete Model');
    if (!ok) return;
    try {
      await motorcycleApi.deleteModel(id);
      setModels(prev => prev.filter(m => m.id !== id));
      toast(`"${name}" deleted.`, 'info');
    } catch (err) {
      toast('Failed to delete model: ' + err.message, 'error');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.motorcycle?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.motorcycle?.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const usersTotalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const usersSafePage   = Math.min(usersPage, usersTotalPages);
  const pagedUsers      = filteredUsers.slice((usersSafePage - 1) * PAGE_SIZE, usersSafePage * PAGE_SIZE);

  const alertsTotalPages = Math.max(1, Math.ceil(alerts.length / PAGE_SIZE));
  const alertsSafePage   = Math.min(alertsPage, alertsTotalPages);
  const pagedAlerts      = alerts.slice((alertsSafePage - 1) * PAGE_SIZE, alertsSafePage * PAGE_SIZE);

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="av-bg av-grid-bg min-h-screen flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" style={{ boxShadow: '0 0 0 3px rgba(192,132,252,0.25)' }} />
              <span className="text-purple-400 text-xs font-semibold tracking-wider">ADMIN ACCESS</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">{userProfile?.displayName || 'Admin'}</p>
            <p className="text-purple-400 text-xs font-semibold">Administrator</p>
          </div>
          <button onClick={() => navigate('/profile')} className="hover:opacity-80 transition-opacity flex-shrink-0" title="My Profile">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile"
                   className="w-9 h-9 rounded-full object-cover"
                   style={{ boxShadow: '0 2px 8px rgba(168,85,247,0.4)' }} />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                   style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 2px 8px rgba(168,85,247,0.4)' }}>
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
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-2 px-2">Admin Panel</p>
          {SB_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`sb-btn ${activeTab === item.key ? 'sb-active' : ''}`}
              style={activeTab === item.key ? { background: 'linear-gradient(135deg,#a855f7,#7c3aed)', borderColor: 'rgba(168,85,247,0.5)', boxShadow: '0 4px 14px rgba(168,85,247,0.35)' } : {}}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <div className="flex-1" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />
          <button onClick={handleLogout} className="sb-btn sb-logout"><LogoutIcon /> Log Out</button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 min-w-0 mobile-pb">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="av-spinner" />
              <p className="text-white/40 text-sm">Loading…</p>
            </div>
          ) : activeTab === 'dashboard' ? (

            /* ── Dashboard ── */
            <div className="space-y-5">
              <h2 className="text-white font-bold text-xl">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Users" value={stats?.users?.total || 0} accent="#a855f7">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Admins</span><span className="text-white/70 font-semibold">{stats?.users?.byRole?.admin || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Security</span><span className="text-white/70 font-semibold">{stats?.users?.byRole?.security || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Users</span><span className="text-white/70 font-semibold">{stats?.users?.byRole?.user || 0}</span>
                    </div>
                  </div>
                </StatCard>

                <StatCard title="Total Alerts" value={stats?.alerts?.total || 0} accent="#ef4444">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Unresponded</span>
                      <span className="text-red-400 font-bold">{stats?.alerts?.unresponded || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Last 24h</span>
                      <span className="text-white/70 font-semibold">{stats?.alerts?.last24Hours || 0}</span>
                    </div>
                  </div>
                </StatCard>

                <div className="glass p-6" style={{ borderLeft: '3px solid #22c55e' }}>
                  <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">Quick Actions</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Add Security', tab: 'addSecurity', color: '#a855f7' },
                      { label: 'View Users', tab: 'users', color: '#6366f1' },
                      { label: 'View Alerts', tab: 'alerts', color: '#22c55e' },
                      { label: 'System Settings', tab: 'settings', color: '#0891b2' },
                    ].map(({ label, tab, color }) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-px"
                        style={{ background: color }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7-day alert trend */}
              <AlertTrend alerts={alerts} />
            </div>

          ) : activeTab === 'addSecurity' ? (

            /* ── Add Security ── */
            <div className="max-w-md mx-auto">
              <h2 className="text-white font-bold text-xl mb-5">Add Security Personnel</h2>
              <div className="glass p-6">
                {formError && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-300 font-medium"
                       style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.35)' }}>
                    {formError}
                  </div>
                )}
                <form onSubmit={handleAddSecurity} className="space-y-4">
                  {[
                    { label: 'Full Name', type: 'text', key: 'displayName', placeholder: 'Enter full name' },
                    { label: 'Email', type: 'email', key: 'email', placeholder: 'Enter email address' },
                    { label: 'Password', type: 'password', key: 'password', placeholder: 'Min 6 characters', minLength: 6 },
                  ].map(({ label, type, key, placeholder, minLength }) => (
                    <div key={key}>
                      <label className="block text-white/60 text-xs uppercase tracking-wider font-semibold mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={securityForm[key]}
                        onChange={(e) => setSecurityForm({ ...securityForm, [key]: e.target.value })}
                        className="av-input"
                        placeholder={placeholder}
                        minLength={minLength}
                        required
                      />
                    </div>
                  ))}
                  <button type="submit" disabled={formLoading}
                    className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 4px 14px rgba(168,85,247,0.4)' }}>
                    {formLoading ? 'Adding…' : 'Add Security Personnel'}
                  </button>
                </form>
              </div>
            </div>

          ) : activeTab === 'users' ? (

            /* ── Users ── */
            <div className="glass h-full p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5 gap-4">
                <h2 className="text-white font-bold text-xl">All Users</h2>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setUsersPage(1); }}
                    placeholder="Search users…"
                    className="av-input pl-9 py-2 text-sm"
                    style={{ width: 220 }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th className="text-left">Photo</th>
                      <th className="text-left">Name</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Phone</th>
                      <th className="text-left">Motorcycle</th>
                      <th className="text-left">Role</th>
                      <th className="text-left">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                               style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                                   style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="font-semibold text-white">{user.displayName || 'N/A'}</td>
                        <td className="text-white/60 text-sm">{user.email}</td>
                        <td className="text-white/60 text-sm">{user.phoneNumber || <span className="text-white/25">—</span>}</td>
                        <td className="text-white/70 text-sm">
                          {user.motorcycle ? (
                            <div>
                              <p className="font-semibold text-white">{user.motorcycle.plateNumber}</p>
                              <p className="text-white/40 text-xs">{user.motorcycle.model || 'N/A'}{user.motorcycles?.length > 1 ? ` +${user.motorcycles.length - 1} more` : ''}</p>
                            </div>
                          ) : 'None'}
                        </td>
                        <td>
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            disabled={user.id === currentUser?.uid}
                            className="px-2 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 outline-none"
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                          >
                            <option value="user" style={{ background: '#1e293b' }}>User</option>
                            <option value="security" style={{ background: '#1e293b' }}>Security</option>
                            <option value="admin" style={{ background: '#1e293b' }}>Admin</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${user.active !== false ? 'badge-green' : 'badge-red'}`}>
                            {user.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleToggleStatus(user.id, user.active === false)}
                              disabled={user.id === currentUser?.uid}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40 hover:opacity-80 transition-all"
                              style={{ background: user.active !== false ? 'rgba(245,158,11,0.7)' : 'rgba(34,197,94,0.7)' }}
                            >
                              {user.active !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => { setPwModal({ userId: user.id, displayName: user.displayName || user.email }); setNewPw(''); }}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white hover:opacity-80 transition-all"
                              style={{ background: 'rgba(99,102,241,0.7)' }}
                              title="Change password"
                            >
                              Pwd
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.uid}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40 hover:opacity-80 transition-all"
                              style={{ background: 'rgba(239,68,68,0.7)' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p className="text-center text-white/40 py-8 text-sm">No users found</p>
                )}
              </div>
              <Pagination
                page={usersSafePage}
                totalPages={usersTotalPages}
                onChange={setUsersPage}
                pageSize={PAGE_SIZE}
                total={filteredUsers.length}
              />
            </div>

          ) : activeTab === 'alerts' ? (

            /* ── Alerts ── */
            <div className="glass h-full p-6 flex flex-col">
              <h2 className="text-white font-bold text-xl mb-5">Alert History</h2>
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <table className="w-full av-table">
                  <thead>
                    <tr>
                      <th className="text-left">Date / Time</th>
                      <th className="text-left">Device ID</th>
                      <th className="text-left">Message</th>
                      <th className="text-left">Severity</th>
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td className="text-white/60 text-xs">{formatDate(alert.timestamp)}</td>
                        <td><span className="badge badge-blue">{alert.deviceId || 'N/A'}</span></td>
                        <td>{alert.message || 'Vibration detected'}</td>
                        <td>
                          <span className={`badge ${
                            alert.severity === 'high' ? 'badge-red'
                              : alert.severity === 'medium' ? 'badge-yellow'
                              : 'badge-blue'
                          }`}>
                            {alert.severity || 'normal'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${alert.responded ? 'badge-green' : 'badge-red'}`}>
                            {alert.responded ? 'Responded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {alerts.length === 0 && (
                  <p className="text-center text-white/40 py-8 text-sm">No alerts found</p>
                )}
              </div>
              <Pagination
                page={alertsSafePage}
                totalPages={alertsTotalPages}
                onChange={setAlertsPage}
                pageSize={PAGE_SIZE}
                total={alerts.length}
              />
            </div>

          ) : activeTab === 'models' ? (

            /* ── Motorcycle Models ── */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Motorcycle Models</h2>
                <span className="text-white/40 text-sm">{models.length} models</span>
              </div>

              {/* Add new model */}
              <div className="glass p-5" style={{ borderLeft: '3px solid #a855f7' }}>
                <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-3">Add New Model</p>
                <form onSubmit={handleAddModel} className="flex gap-2">
                  <input
                    type="text"
                    value={newModelName}
                    onChange={e => setNewModelName(e.target.value)}
                    placeholder="e.g. Honda ADV 160"
                    className="av-input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={modelSaving || !newModelName.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-white text-sm flex-shrink-0 disabled:opacity-50 transition-all hover:-translate-y-px"
                    style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 4px 14px rgba(168,85,247,0.3)' }}>
                    {modelSaving ? 'Adding…' : '+ Add'}
                  </button>
                </form>
              </div>

              {/* Model list */}
              <div className="glass p-5">
                <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">All Models</p>
                {modelsLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="av-spinner" /></div>
                ) : models.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-6">No models yet. Add one above.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {models.map(model => (
                      <div key={model.id} className="flex items-center gap-2 px-4 py-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {editingModelId === model.id ? (
                          <>
                            <input
                              type="text"
                              value={editingModelName}
                              onChange={e => setEditingModelName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleUpdateModel(model.id); if (e.key === 'Escape') setEditingModelId(null); }}
                              className="av-input flex-1 py-1 text-sm"
                              autoFocus
                            />
                            <button onClick={() => handleUpdateModel(model.id)}
                              className="text-green-400 hover:text-green-300 text-xs font-bold px-2 transition-colors">Save</button>
                            <button onClick={() => setEditingModelId(null)}
                              className="text-white/40 hover:text-white/70 text-xs px-1 transition-colors">✕</button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-white text-sm font-medium truncate">{model.name}</span>
                            <button
                              onClick={() => { setEditingModelId(model.id); setEditingModelName(model.name); }}
                              className="text-white/30 hover:text-indigo-400 transition-colors p-1 flex-shrink-0"
                              title="Edit">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id, model.name)}
                              className="text-white/30 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                              title="Delete">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          ) : (

            /* ── System Settings ── */
            <div className="space-y-5">
              <h2 className="text-white font-bold text-xl">System Settings</h2>

              {/* System info card */}
              <div className="glass p-6" style={{ borderLeft: '3px solid #a855f7' }}>
                <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">System Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'System Name', value: 'ALERTVIBE' },
                    { label: 'Institution', value: 'MSU-TCTO' },
                    { label: 'Location', value: 'Sanga-sanga, Bongao, Tawi-Tawi' },
                    { label: 'Institute', value: 'Institute of Information Communication Technology' },
                    { label: 'Microcontroller', value: 'ESP32 DevKit V1' },
                    { label: 'Vibration Sensor', value: 'SW-420' },
                    { label: 'Notification Platform', value: 'Firebase Cloud Messaging (FCM)' },
                    { label: 'Power Supply', value: '12V Motorcycle Battery → LM2596 (5V)' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-4"
                         style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-1">{label}</p>
                      <p className="text-white font-semibold text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vibration thresholds */}
              <div className="glass p-6" style={{ borderLeft: '3px solid #ef4444' }}>
                <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">
                  Vibration Threshold Configuration
                </p>
                <div className="space-y-3">
                  {[
                    { level: 'Light', badge: 'badge-green', action: 'Log only — no notification sent', desc: 'Environmental noise: wind, accidental contact' },
                    { level: 'Moderate', badge: 'badge-yellow', action: 'Push notification → Owner & Security', desc: 'Suspicious: touch, slight movement, tampering' },
                    { level: 'Strong', badge: 'badge-red', action: 'Immediate push notification via Firebase', desc: 'Critical: forced movement, attempted theft' },
                  ].map(({ level, badge, action, desc }) => (
                    <div key={level} className="flex items-center gap-4 p-3 rounded-xl"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className={`badge ${badge} flex-shrink-0`}>{level}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium">{action}</p>
                        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance specs */}
              <div className="glass p-6" style={{ borderLeft: '3px solid #22c55e' }}>
                <p className="text-white/45 text-xs uppercase tracking-widest font-semibold mb-4">
                  Performance Requirements
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Alert Response Time', value: '1 – 2 seconds', sub: 'From detection to notification delivery' },
                    { label: 'Concurrent Users', value: 'Up to 100', sub: 'Without notable performance decline' },
                    { label: 'Connectivity', value: 'Wi-Fi (Campus)', sub: 'MSU-TCTO campus network required' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="rounded-xl p-4 text-center"
                         style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{label}</p>
                      <p className="text-white font-black text-xl mb-1">{value}</p>
                      <p className="text-white/35 text-xs">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Password Reset Modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={() => setPwModal(null)}>
          <div className="glass w-full max-w-sm"
               style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
               onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 py-4"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <h2 className="text-white font-bold text-base">Change Password</h2>
                <p className="text-white/45 text-xs mt-0.5 truncate max-w-[220px]">{pwModal.displayName}</p>
              </div>
              <button onClick={() => setPwModal(null)}
                      className="text-white/40 hover:text-white/80 text-2xl leading-none transition-colors">&times;</button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-white/55 text-xs uppercase tracking-wider font-semibold mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  className="av-input"
                  placeholder="Min 6 characters"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  minLength={6}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPwModal(null)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingPw}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:-translate-y-px"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                  {savingPw ? 'Saving…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile bottom nav — maps sidebar tabs to icons */}
      <BottomNav
        activeKey={activeTab}
        items={[
          { key: 'dashboard', label: 'Overview', activeColor: '#a855f7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
            onClick: () => setActiveTab('dashboard') },
          { key: 'users', label: 'Users', activeColor: '#a855f7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
            onClick: () => setActiveTab('users') },
          { key: 'alerts', label: 'Alerts', activeColor: '#a855f7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
            onClick: () => setActiveTab('alerts') },
          { key: 'logout', label: 'Logout',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
            onClick: handleLogout },
        ]}
      />
    </div>
  );
}

export default AdminDashboard;
