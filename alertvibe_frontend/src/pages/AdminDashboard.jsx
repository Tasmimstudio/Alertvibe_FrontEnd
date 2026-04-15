// pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, userApi } from '../services/api';

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

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [securityForm, setSecurityForm] = useState({ email: '', password: '', displayName: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    if (!isAdmin()) { navigate('/'); return; }
    fetchData();
  }, []);

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
    try {
      await adminApi.updateUserRole(userId, newRole);
      fetchData();
      alert('User role updated successfully');
    } catch (error) { alert('Failed to update role: ' + error.message); }
  };

  const handleToggleStatus = async (userId, active) => {
    try {
      await adminApi.toggleUserStatus(userId, active);
      fetchData();
      alert(`User ${active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) { alert('Failed to update status: ' + error.message); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      fetchData();
      alert('User deleted successfully');
    } catch (error) { alert('Failed to delete user: ' + error.message); }
  };

  const handleAddSecurity = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await userApi.createWithRole({ ...securityForm, role: 'security' });
      setFormSuccess('Security personnel added successfully!');
      setSecurityForm({ email: '', password: '', displayName: '' });
      fetchData();
    } catch (error) {
      setFormError(error.message || 'Failed to add security personnel');
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || 'A';

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
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
               style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 2px 8px rgba(168,85,247,0.4)' }}>
            {initials}
          </div>
        </div>
      </header>

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 p-5 flex flex-col gap-1"
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
        <main className="flex-1 p-6 min-w-0">
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
                {formSuccess && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm text-green-300 font-medium"
                       style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)' }}>
                    {formSuccess}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      <th className="text-left">Name</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Role</th>
                      <th className="text-left">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="font-semibold text-white">{user.displayName || 'N/A'}</td>
                        <td className="text-white/60 text-sm">{user.email}</td>
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
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(user.id, user.active === false)}
                              disabled={user.id === currentUser?.uid}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40 hover:opacity-80 transition-all"
                              style={{ background: user.active !== false ? 'rgba(245,158,11,0.7)' : 'rgba(34,197,94,0.7)' }}
                            >
                              {user.active !== false ? 'Deactivate' : 'Activate'}
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
            </div>

          ) : (

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
                    {alerts.map((alert) => (
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
