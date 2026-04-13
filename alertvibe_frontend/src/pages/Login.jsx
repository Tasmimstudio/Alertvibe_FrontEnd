// pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && userProfile) {
      redirectBasedOnRole(userProfile.role);
    }
  }, [currentUser, userProfile]);

  const redirectBasedOnRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'security':
        navigate('/security');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password);
      // Role-based redirect will happen via useEffect when userProfile loads
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Please contact admin for password reset');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
         }}>

      {/* Main login card */}
      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2"
              style={{
                color: '#dc2626',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.1em'
              }}>
            WELCOME TO ALERTVIBE
          </h1>
          <p className="text-white text-xl font-medium">
            Your smart Motorcycle Security System
          </p>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: '#dc2626' }}>
                A<span className="text-gray-700">/</span>V
              </div>
              <div className="text-xs font-semibold text-yellow-600 mt-1">
                ALERT VIBE
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 text-white px-4 py-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-6 py-3 rounded-full text-gray-700 text-center text-lg"
            style={{
              border: '3px solid #d4af37',
              background: 'rgba(255, 255, 255, 0.95)',
              outline: 'none'
            }}
            placeholder="Username"
            required
          />

          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-6 py-3 rounded-full text-gray-700 text-center text-lg"
            style={{
              border: '3px solid #d4af37',
              background: 'rgba(255, 255, 255, 0.95)',
              outline: 'none'
            }}
            placeholder="Password"
            required
          />

          {/* Forgot password and buttons */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-red-500 font-semibold hover:text-red-400 transition-colors"
            >
              Forgot Password?
            </button>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2 rounded-md font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: '#dc2626',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                {loading ? 'Processing...' : 'Log in'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-8 py-2 rounded-md font-bold text-white transition-all hover:scale-105"
                style={{
                  background: '#06b6d4',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </form>


        {/* Admin Setup Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/admin-setup')}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            First time? Setup Admin Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
