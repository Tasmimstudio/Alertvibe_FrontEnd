// pages/AlertHistory.jsx (View Full Alert Log)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi } from '../services/api';

const AlertHistory = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await alertApi.listAlerts();
      const formattedAlerts = (Array.isArray(data) ? data : []).map(alert => {
        const timestamp = alert.timestamp?._seconds
          ? new Date(alert.timestamp._seconds * 1000)
          : alert.timestamp
            ? new Date(alert.timestamp)
            : new Date();

        return {
          id: alert.id,
          date: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          time: timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          motorcycle: alert.deviceId || 'Unknown',
          message: alert.message || 'VIBRATION DETECTED',
          isRead: alert.responded || false
        };
      });
      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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

  const toggleReadStatus = (alertId) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, isRead: !alert.isRead }
        : alert
    ));
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-700">
        {/* Logo and Title */}
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
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-green-400 font-semibold text-sm">CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Search and User Profile */}
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
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
          >
            HOME
          </button>
          <button
            onClick={() => navigate('/devices')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
          >
            Manage Motorcycles
          </button>
          <button
            onClick={() => navigate('/history')}
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 transition-all shadow-md"
            style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            }}
          >
            View Full Alert Log
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
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No alerts found. Your motorcycle is safe!</p>
              </div>
            ) : (
              /* Alert Table */
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#4ade80' }}>
                    <th className="px-6 py-4 text-left font-bold text-white">DATE</th>
                    <th className="px-6 py-4 text-left font-bold text-white">TIME</th>
                    <th className="px-6 py-4 text-left font-bold text-white">MOTORCYCLE</th>
                    <th className="px-6 py-4 text-left font-bold text-white">MESSAGE</th>
                    <th className="px-6 py-4 text-left font-bold text-white">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <tr
                      key={alert.id}
                      className="border-b border-gray-200"
                      style={{
                        background: index % 2 === 0 ? '#ffffff' : '#d1fae5'
                      }}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-700">{alert.date}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{alert.time}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{alert.motorcycle}</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{alert.message}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">
                            {alert.isRead ? 'READ' : 'UNREAD'}
                          </span>
                          <input
                            type="checkbox"
                            checked={alert.isRead}
                            onChange={() => toggleReadStatus(alert.id)}
                            className="w-5 h-5 cursor-pointer accent-red-500"
                          />
                        </div>
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
  );
};

export default AlertHistory;
