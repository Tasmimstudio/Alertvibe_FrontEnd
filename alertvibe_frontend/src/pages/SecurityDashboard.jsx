// pages/SecurityDashboard.jsx (Security Dashboard)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityApi } from '../services/api';

function SecurityDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [searchPlate, setSearchPlate] = useState('');
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(null);

  useEffect(() => {
    fetchMotorcycles();
  }, []);

  const fetchMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await securityApi.getMotorcyclesWithOwners();
      const formattedMotorcycles = (data.motorcycles || []).map(m => ({
        id: m.id,
        owner: m.ownerName || 'Unknown',
        plateNumber: m.plateNumber || '',
        model: m.model || '',
        color: m.color || '',
        deviceCode: m.deviceCode || '',
        department: m.department || null,
        photoURL: m.photoURL || null,
        ownerPhone: m.ownerPhone || null,
        ownerEmail: m.ownerEmail || null,
        status: m.status || 'active',
        isActivated: m.isActivated !== false,
        createdAt: m.createdAt || null,
      }));
      setMotorcycles(formattedMotorcycles);
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

  const handleSearch = async () => {
    if (!searchPlate.trim()) {
      fetchMotorcycles();
    }
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
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

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
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 transition-all shadow-md"
            style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
            }}
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
            className="w-full px-6 py-3 rounded-lg font-bold text-gray-800 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
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
            {/* Search Section */}
            <div className="flex gap-3 mb-6">
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
                placeholder="PLATE NO. / OWNER / DEVICE CODE"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded text-gray-700 font-semibold"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>

            {/* Motorcycles Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading motorcycles...</p>
                </div>
              ) : filteredMotorcycles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No motorcycles found.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#fbbf24' }}>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">PHOTO</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">OWNER</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">PHONE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">EMAIL</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">PLATE NUMBER</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">MODEL</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">COLOR</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">DEVICE CODE</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-800">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMotorcycles.map((motorcycle, index) => (
                      <tr
                        key={motorcycle.id}
                        className="border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
                        style={{
                          background: index % 2 === 0 ? '#ffffff' : '#f3f4f6'
                        }}
                        onClick={() => setSelectedMotorcycle(motorcycle)}
                      >
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
                            {motorcycle.photoURL ? (
                              <img src={motorcycle.photoURL} alt="Motorcycle" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{motorcycle.owner}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {motorcycle.ownerPhone ? (
                            <a
                              href={`tel:${motorcycle.ownerPhone}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {motorcycle.ownerPhone}
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {motorcycle.ownerEmail ? (
                            <a
                              href={`mailto:${motorcycle.ownerEmail}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {motorcycle.ownerEmail}
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{motorcycle.plateNumber}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{motorcycle.model}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{motorcycle.color}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{motorcycle.deviceCode}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{
                              background: motorcycle.isActivated ? '#dcfce7' : '#fee2e2',
                              color: motorcycle.isActivated ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {motorcycle.isActivated ? 'ACTIVE' : 'INACTIVE'}
                          </span>
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

      {/* Motorcycle Detail Modal */}
      {selectedMotorcycle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSelectedMotorcycle(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ background: '#1e3a5f' }}
            >
              <h2 className="text-lg font-bold text-white">Motorcycle Details</h2>
              <button
                onClick={() => setSelectedMotorcycle(null)}
                className="text-white hover:text-gray-300 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {/* Photo Section */}
              <div className="mb-6">
                {selectedMotorcycle.photoURL ? (
                  <div className="w-full rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '320px' }}>
                    <img
                      src={selectedMotorcycle.photoURL}
                      alt={`${selectedMotorcycle.model} - ${selectedMotorcycle.plateNumber}`}
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '320px' }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-400 mt-2 text-sm">No photo available</p>
                  </div>
                )}
              </div>

              {/* Plate Number + Status Banner */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span
                    className="px-4 py-2 rounded-lg text-xl font-black tracking-wider"
                    style={{ background: '#fbbf24', color: '#1a1a2e' }}
                  >
                    {selectedMotorcycle.plateNumber}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: selectedMotorcycle.isActivated ? '#dcfce7' : '#fee2e2',
                      color: selectedMotorcycle.isActivated ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {selectedMotorcycle.isActivated ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              {/* Motorcycle Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase font-bold">Model</div>
                  <div className="text-gray-800 font-semibold text-lg">{selectedMotorcycle.model}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase font-bold">Color</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ background: selectedMotorcycle.color.toLowerCase() }}
                    />
                    <span className="text-gray-800 font-semibold text-lg">{selectedMotorcycle.color}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase font-bold">Device Code</div>
                  <div className="text-gray-800 font-semibold">{selectedMotorcycle.deviceCode}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 uppercase font-bold">Department</div>
                  <div className="text-gray-800 font-semibold">{selectedMotorcycle.department || 'N/A'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <div className="text-xs text-gray-500 uppercase font-bold">Registered</div>
                  <div className="text-gray-800 font-semibold">{formatDate(selectedMotorcycle.createdAt)}</div>
                </div>
              </div>

              {/* Owner Contact Section */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-5">
                <div className="text-xs text-blue-700 uppercase font-bold mb-3">Owner Information</div>
                <div className="text-gray-800 font-bold text-lg mb-2">{selectedMotorcycle.owner}</div>
                <div className="flex flex-wrap gap-3">
                  {selectedMotorcycle.ownerPhone ? (
                    <a
                      href={`tel:${selectedMotorcycle.ownerPhone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                      style={{ background: '#16a34a' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      CALL {selectedMotorcycle.ownerPhone}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm py-2">No phone number</span>
                  )}
                  {selectedMotorcycle.ownerEmail ? (
                    <a
                      href={`mailto:${selectedMotorcycle.ownerEmail}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                      style={{ background: '#2563eb' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      EMAIL {selectedMotorcycle.ownerEmail}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm py-2">No email</span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedMotorcycle(null)}
                className="w-full px-6 py-3 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityDashboard;
