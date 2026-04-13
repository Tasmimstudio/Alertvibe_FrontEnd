import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertApi, motorcycleApi } from '../services/api';
import { onMessageListener } from '../services/NotificationService';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('lastAlert');
  const [alerts, setAlerts] = useState([]);
  const [motorcycleInfo, setMotorcycleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupMessageListener();
    fetchData();
  }, [currentUser]);

  const setupMessageListener = () => {
    onMessageListener()
      .then((payload) => {
        console.log('Received foreground message:', payload);
        const newAlert = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(),
          message: payload.notification?.body || 'New alert received',
        };
        setAlerts((prev) => [newAlert, ...prev]);
      })
      .catch((err) => console.error('Failed to receive message:', err));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch alerts
      const alertsData = await alertApi.listAlerts();
      const formattedAlerts = (Array.isArray(alertsData) ? alertsData : []).map(alert => ({
        id: alert.id,
        date: alert.timestamp ? new Date(alert.timestamp._seconds ? alert.timestamp._seconds * 1000 : alert.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'N/A',
        message: alert.message || 'Vibration detected',
        deviceId: alert.deviceId,
        severity: alert.severity
      }));
      setAlerts(formattedAlerts);

      // Fetch user's motorcycles
      if (currentUser) {
        const motorcyclesData = await motorcycleApi.list({ ownerId: currentUser.uid });
        if (motorcyclesData.motorcycles && motorcyclesData.motorcycles.length > 0) {
          const motorcycle = motorcyclesData.motorcycles[0];
          setMotorcycleInfo({
            plateNumber: motorcycle.plateNumber || 'N/A',
            model: motorcycle.model || 'N/A',
            color: motorcycle.color || 'N/A',
            deviceCode: motorcycle.deviceCode || 'N/A',
            department: motorcycle.department || 'N/A'
          });
        }
      }
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
            <div
              className="px-6 py-2 rounded bg-white text-gray-800 font-semibold text-center"
              style={{ width: '250px' }}
            >
              {userProfile?.displayName || 'User'}
            </div>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-xl overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {userProfile?.displayName?.charAt(0) || 'U'}
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
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
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
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('lastAlert')}
              className={`px-8 py-3 font-bold text-white transition-all ${
                activeTab === 'lastAlert' ? 'bg-red-600' : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              Last Alert
            </button>
            <button
              onClick={() => setActiveTab('motorcycleInfo')}
              className={`px-8 py-3 font-bold text-white transition-all ${
                activeTab === 'motorcycleInfo' ? 'bg-red-600' : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              Registered Motorcycle Info
            </button>
            <button
              onClick={() => setActiveTab('alertHistory')}
              className={`px-8 py-3 font-bold text-white transition-all ${
                activeTab === 'alertHistory' ? 'bg-red-600' : 'bg-pink-500 hover:bg-pink-600'
              }`}
            >
              Alert History Preview
            </button>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-xl p-6 min-h-[500px]">
            {activeTab === 'lastAlert' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading alerts...</p>
                  </div>
                ) : alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border-2 border-gray-300 rounded-lg p-6">
                      <h3 className="font-bold text-gray-800 mb-2">{alert.date}</h3>
                      <p className="text-gray-700 leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No alerts yet. Your motorcycle is safe!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'motorcycleInfo' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Motorcycle Information</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : motorcycleInfo ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <label className="text-gray-600 font-semibold">Plate Number</label>
                      <p className="text-xl font-bold text-gray-800 mt-2">{motorcycleInfo.plateNumber}</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <label className="text-gray-600 font-semibold">Model</label>
                      <p className="text-xl font-bold text-gray-800 mt-2">{motorcycleInfo.model}</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <label className="text-gray-600 font-semibold">Color</label>
                      <p className="text-xl font-bold text-gray-800 mt-2">{motorcycleInfo.color}</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-4">
                      <label className="text-gray-600 font-semibold">Device Code</label>
                      <p className="text-xl font-bold text-gray-800 mt-2">{motorcycleInfo.deviceCode}</p>
                    </div>
                    <div className="border-2 border-gray-300 rounded-lg p-4 col-span-2">
                      <label className="text-gray-600 font-semibold">Department</label>
                      <p className="text-xl font-bold text-gray-800 mt-2">{motorcycleInfo.department}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No motorcycle registered yet.</p>
                    <button
                      onClick={() => navigate('/register')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Register a Motorcycle
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'alertHistory' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Alert History</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                  </div>
                ) : alerts.length > 0 ? (
                  alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="border-2 border-gray-300 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{alert.date}</h3>
                      <p className="text-gray-700 text-sm">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No alert history available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
