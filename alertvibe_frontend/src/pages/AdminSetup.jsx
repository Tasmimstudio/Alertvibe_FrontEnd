// pages/AdminSetup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';

function AdminSetup() {
  const navigate = useNavigate();
  const { currentUser, fetchUserProfile } = useAuth();
  const [setupKey, setSetupKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSetupAdmin = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to setup admin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await userApi.setupAdmin({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'System Admin',
        setupKey: setupKey,
      });

      setSuccess(true);

      // Refresh user profile to get new role
      await fetchUserProfile(currentUser);

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#dc2626' }}>
                  A<span className="text-gray-700">/</span>V
                </div>
                <div className="text-[8px] font-semibold text-yellow-600 mt-0.5">
                  ALERT VIBE
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Setup</h1>
          <p className="text-gray-400">Initialize the first administrator account</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/20 border-2 border-green-500 text-green-300 px-4 py-3 rounded-lg mb-4 text-center">
            Admin account created successfully! Redirecting to admin dashboard...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Info Box */}
        {!success && (
          <div className="bg-blue-500/20 border-2 border-blue-500 text-blue-300 px-4 py-3 rounded-lg mb-6 text-sm">
            <p className="font-semibold mb-1">Setup Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure you're logged in with the account you want to make admin</li>
              <li>Enter the setup key (default: alertvibe-admin-setup-2024)</li>
              <li>This only works if no admin exists yet</li>
            </ol>
          </div>
        )}

        {/* Setup Form */}
        {!success && (
          <form onSubmit={handleSetupAdmin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Current User
              </label>
              <input
                type="text"
                value={currentUser?.email || 'Not logged in'}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-gray-300 border-2 border-gray-600"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Setup Key
              </label>
              <input
                type="password"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                placeholder="Enter setup key"
                className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !currentUser}
              className="w-full py-1.5 rounded-lg font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: '#dc2626' }}
            >
              {loading ? 'Setting up...' : 'Create Admin Account'}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-5 py-1.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))', border: '1px solid rgba(139,92,246,0.35)', color: 'rgba(255,255,255,0.85)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSetup;
