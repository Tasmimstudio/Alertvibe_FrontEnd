// pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, userApi } from '../services/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Security Form State
  const [securityForm, setSecurityForm] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
      return;
    }
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
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      fetchData();
      alert('User role updated successfully');
    } catch (error) {
      alert('Failed to update role: ' + error.message);
    }
  };

  const handleToggleStatus = async (userId, active) => {
    try {
      await adminApi.toggleUserStatus(userId, active);
      fetchData();
      alert(`User ${active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(userId);
      fetchData();
      alert('User deleted successfully');
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  // Add Security Handler
  const handleAddSecurity = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await userApi.createWithRole({
        email: securityForm.email,
        password: securityForm.password,
        displayName: securityForm.displayName,
        role: 'security',
      });
      setFormSuccess('Security personnel added successfully!');
      setSecurityForm({ email: '', password: '', displayName: '' });
      fetchData();
    } catch (error) {
      setFormError(error.message || 'Failed to add security personnel');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp._seconds
      ? new Date(timestamp._seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
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
            <h1 className="text-3xl font-bold text-white tracking-wide">ADMIN DASHBOARD</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-purple-400 font-semibold text-sm">ADMIN ACCESS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="px-6 py-2 rounded bg-white text-gray-800 font-semibold text-center"
            style={{ width: '200px' }}
          >
            {userProfile?.displayName || 'Admin'}
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl">
            <span className="text-white text-2xl font-bold">
              {userProfile?.displayName?.charAt(0) || 'A'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 p-6 space-y-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white'
                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('addSecurity')}
            className={`w-full px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
              activeTab === 'addSecurity'
                ? 'bg-purple-600 text-white'
                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400'
            }`}
          >
            Add Security
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400'
            }`}
          >
            View Users
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full px-6 py-3 rounded-lg font-bold transition-all shadow-md ${
              activeTab === 'alerts'
                ? 'bg-purple-600 text-white'
                : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400'
            }`}
          >
            Alert History
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
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="mt-4 text-white">Loading...</p>
            </div>
          ) : activeTab === 'dashboard' ? (
            /* Dashboard Stats */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Users Card */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-gray-600 font-semibold mb-2">Total Users</h3>
                  <p className="text-4xl font-bold text-gray-800">{stats?.users?.total || 0}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-600">
                      Admins: <span className="font-semibold">{stats?.users?.byRole?.admin || 0}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Security: <span className="font-semibold">{stats?.users?.byRole?.security || 0}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Users: <span className="font-semibold">{stats?.users?.byRole?.user || 0}</span>
                    </p>
                  </div>
                </div>

                {/* Total Alerts Card */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-gray-600 font-semibold mb-2">Total Alerts</h3>
                  <p className="text-4xl font-bold text-gray-800">{stats?.alerts?.total || 0}</p>
                  <div className="mt-4 space-y-1">
                    <p className="text-sm text-gray-600">
                      Unresponded:{' '}
                      <span className="font-semibold text-red-600">
                        {stats?.alerts?.unresponded || 0}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Last 24h:{' '}
                      <span className="font-semibold">{stats?.alerts?.last24Hours || 0}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-xl p-6">
                  <h3 className="text-gray-600 font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('addSecurity')}
                      className="w-full py-2 px-4 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700"
                    >
                      Add Security
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                    >
                      View Users
                    </button>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                    >
                      View Alerts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'addSecurity' ? (
            /* Add Security Form */
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Security Personnel</h2>

              {formError && (
                <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-100 border-2 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleAddSecurity} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                  <input
                    type="text"
                    value={securityForm.displayName}
                    onChange={(e) => setSecurityForm({ ...securityForm, displayName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={securityForm.email}
                    onChange={(e) => setSecurityForm({ ...securityForm, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    value={securityForm.password}
                    onChange={(e) => setSecurityForm({ ...securityForm, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter password (min 6 characters)"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : 'Add Security Personnel'}
                </button>
              </form>
            </div>
          ) : activeTab === 'users' ? (
            /* Users Management */
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-600 text-white">
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="border-b"
                        style={{ background: index % 2 === 0 ? '#ffffff' : '#f3f4f6' }}
                      >
                        <td className="px-4 py-3 text-gray-700">{user.email}</td>
                        <td className="px-4 py-3 text-gray-700">{user.displayName || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            className="px-2 py-1 border rounded bg-white"
                            disabled={user.id === currentUser?.uid}
                          >
                            <option value="user">User</option>
                            <option value="security">Security</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-sm font-semibold ${
                              user.active !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(user.id, user.active === false)}
                              disabled={user.id === currentUser?.uid}
                              className={`px-3 py-1 rounded text-white text-sm font-semibold disabled:opacity-50 ${
                                user.active !== false
                                  ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {user.active !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === currentUser?.uid}
                              className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
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
                  <p className="text-center text-gray-500 py-8">No users found</p>
                )}
              </div>
            </div>
          ) : (
            /* Alert History */
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Alert History</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-purple-600 text-white">
                      <th className="px-4 py-3 text-left">Date/Time</th>
                      <th className="px-4 py-3 text-left">Device ID</th>
                      <th className="px-4 py-3 text-left">Message</th>
                      <th className="px-4 py-3 text-left">Severity</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, index) => (
                      <tr
                        key={alert.id}
                        className="border-b"
                        style={{ background: index % 2 === 0 ? '#ffffff' : '#f3f4f6' }}
                      >
                        <td className="px-4 py-3 text-gray-700">{formatDate(alert.timestamp)}</td>
                        <td className="px-4 py-3 text-gray-700">{alert.deviceId || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{alert.message || 'Vibration detected'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-sm font-semibold ${
                              alert.severity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : alert.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alert.severity || 'Normal'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-sm font-semibold ${
                              alert.responded
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {alert.responded ? 'Responded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {alerts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No alerts found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
