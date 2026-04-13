import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-2xl font-bold hover:text-blue-200">
              AlertVibe
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="hover:text-blue-200 transition-colors duration-200 font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/history"
              className="hover:text-blue-200 transition-colors duration-200 font-medium"
            >
              Alert History
            </Link>
            <Link
              to="/devices"
              className="hover:text-blue-200 transition-colors duration-200 font-medium"
            >
              My Devices
            </Link>
            {(userProfile?.role === 'security' || userProfile?.role === 'admin') && (
              <Link
                to="/security"
                className="hover:text-blue-200 transition-colors duration-200 font-medium"
              >
                Security
              </Link>
            )}
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  {userProfile?.displayName || currentUser.email}
                  {userProfile?.role && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-800 rounded">
                      {userProfile.role}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1 bg-blue-700 hover:bg-blue-800 rounded transition-colors duration-200 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1 bg-blue-700 hover:bg-blue-800 rounded transition-colors duration-200 font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
