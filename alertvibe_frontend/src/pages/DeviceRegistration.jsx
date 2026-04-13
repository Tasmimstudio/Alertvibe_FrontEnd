// pages/DeviceRegistration.jsx (Manage Motorcycles)
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motorcycleApi } from '../services/api';

function DeviceRegistration() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Loading status...');
  const [isActivated, setIsActivated] = useState(true);
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    fetchMotorcycles();
  }, [currentUser]);

  const fetchMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await motorcycleApi.list();
      setMotorcycles(data.motorcycles || []);
      if (data.motorcycles && data.motorcycles.length > 0) {
        const firstMotorcycle = data.motorcycles[0];
        setSelectedMotorcycle(firstMotorcycle);
        setIsActivated(firstMotorcycle.isActivated !== false);
        setCurrentStatus(firstMotorcycle.location || 'Location not set');
      }
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
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

  const handleActivate = async () => {
    if (!selectedMotorcycle) return;
    try {
      await motorcycleApi.toggleActivation(selectedMotorcycle.id, true);
      setIsActivated(true);
      alert('Motorcycle security system activated!');
      fetchMotorcycles();
    } catch (error) {
      console.error('Error activating:', error);
      alert('Failed to activate: ' + error.message);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedMotorcycle) return;
    try {
      await motorcycleApi.toggleActivation(selectedMotorcycle.id, false);
      setIsActivated(false);
      alert('Motorcycle security system deactivated!');
      fetchMotorcycles();
    } catch (error) {
      console.error('Error deactivating:', error);
      alert('Failed to deactivate: ' + error.message);
    }
  };

  const handleEdit = (motorcycle) => {
    navigate(`/register?edit=${motorcycle.id}`);
  };

  const handleAdd = () => {
    navigate('/register');
  };

  const handleDelete = async (motorcycle) => {
    if (confirm(`Are you sure you want to delete motorcycle ${motorcycle.plateNumber}?`)) {
      try {
        await motorcycleApi.delete(motorcycle.id);
        alert('Motorcycle deleted successfully!');
        fetchMotorcycles();
      } catch (error) {
        console.error('Error deleting motorcycle:', error);
        alert('Failed to delete: ' + error.message);
      }
    }
  };

  const handleStatus = (motorcycle) => {
    setSelectedMotorcycle(motorcycle);
    setIsActivated(motorcycle.isActivated !== false);
    setCurrentStatus(motorcycle.location || 'Location not set');
  };

  const handlePhotoClick = (motorcycleId) => {
    setUploadingPhotoId(motorcycleId);
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingPhotoId) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    try {
      await motorcycleApi.uploadPhoto(uploadingPhotoId, file);
      alert('Photo uploaded successfully!');
      fetchMotorcycles();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploadingPhotoId(null);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      {/* Hidden file input for photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

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
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 transition-all shadow-md"
            style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            }}
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
          <div className="bg-white rounded-lg shadow-xl p-6">
            {/* Header */}
            <div className="bg-gray-300 px-6 py-3 -mx-6 -mt-6 mb-6 rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-800">REGISTERED MOTORCYCLE</h2>
            </div>

            {/* Status and Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">Status</label>
                <input
                  type="text"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={handleActivate}
                  disabled={isActivated}
                  className="px-8 py-2 rounded font-bold text-white transition-all hover:scale-105 disabled:opacity-70"
                  style={{ background: '#22c55e' }}
                >
                  ACTIVATE
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={!isActivated}
                  className="px-8 py-2 rounded font-bold text-white transition-all hover:scale-105 disabled:opacity-70"
                  style={{ background: '#dc2626' }}
                >
                  DEACTIVATE
                </button>
              </div>
            </div>

            {/* Motorcycles Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading motorcycles...</p>
                </div>
              ) : motorcycles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No motorcycles registered yet.</p>
                  <button
                    onClick={handleAdd}
                    className="px-6 py-2 rounded font-bold text-white"
                    style={{ background: '#22c55e' }}
                  >
                    Register Your First Motorcycle
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left font-bold">PHOTO</th>
                      <th className="px-4 py-3 text-left font-bold">PLATE NUMBER</th>
                      <th className="px-4 py-3 text-left font-bold">MODEL</th>
                      <th className="px-4 py-3 text-left font-bold">COLOR</th>
                      <th className="px-4 py-3 text-left font-bold">DEVICE CODE</th>
                      <th className="px-4 py-3 text-center font-bold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {motorcycles.map((motorcycle, index) => (
                      <tr
                        key={motorcycle.id}
                        className={`border-b border-gray-200 ${selectedMotorcycle?.id === motorcycle.id ? 'ring-2 ring-blue-500' : ''}`}
                        style={{
                          background: index % 2 === 0 ? '#f97316' : '#fb923c'
                        }}
                      >
                        <td className="px-4 py-3">
                          <div
                            onClick={() => handlePhotoClick(motorcycle.id)}
                            className="w-12 h-12 rounded bg-white/30 flex items-center justify-center cursor-pointer hover:bg-white/50 transition-all overflow-hidden"
                            title="Click to upload photo"
                          >
                            {motorcycle.photoURL ? (
                              <img src={motorcycle.photoURL} alt="Motorcycle" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{motorcycle.plateNumber}</td>
                        <td className="px-4 py-3 font-bold text-white">{motorcycle.model}</td>
                        <td className="px-4 py-3 font-bold text-white">{motorcycle.color}</td>
                        <td className="px-4 py-3 font-bold text-white">{motorcycle.deviceCode}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEdit(motorcycle)}
                              className="px-4 py-1 rounded font-bold text-white text-sm"
                              style={{ background: '#3b82f6' }}
                            >
                              EDIT
                            </button>
                            <button
                              onClick={handleAdd}
                              className="px-4 py-1 rounded font-bold text-white text-sm"
                              style={{ background: '#22c55e' }}
                            >
                              ADD
                            </button>
                            <button
                              onClick={() => handleDelete(motorcycle)}
                              className="px-4 py-1 rounded font-bold text-white text-sm"
                              style={{ background: '#dc2626' }}
                            >
                              DELETE
                            </button>
                            <button
                              onClick={() => handleStatus(motorcycle)}
                              className="px-4 py-1 rounded font-bold text-white text-sm"
                              style={{ background: '#d97706' }}
                            >
                              STATUS
                            </button>
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
    </div>
  );
}

export default DeviceRegistration;
