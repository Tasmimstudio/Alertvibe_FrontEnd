import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import AlertHistory from './pages/AlertHistory';
import DeviceRegistration from './pages/DeviceRegistration';
import SecurityDashboard from './pages/SecurityDashboard';
import SecurityAlertLog from './pages/SecurityAlertLog';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetup from './pages/AdminSetup';
import Login from './pages/Login';
import Registration from './pages/Registration';
import { requestNotificationPermission } from './services/NotificationService';

// Protected Route component
function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const userRole = userProfile?.role || 'user';
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Admin can access everything
    if (userRole === 'admin') {
      return children;
    }

    // Security can access security and user routes
    if (userRole === 'security' && (allowedRoles.includes('security') || allowedRoles.includes('user'))) {
      return children;
    }

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" />;
    }
  }

  return children;
}

function AppContent() {
  useEffect(() => {
    // Request notification permission when app loads
    requestNotificationPermission()
      .then((token) => {
        if (token) {
          console.log('Notification permission granted and token saved');
        }
      })
      .catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* User routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DeviceRegistration /></ProtectedRoute>} />

        {/* Security routes */}
        <Route path="/security" element={<ProtectedRoute requiredRole={['security', 'admin']}><SecurityDashboard /></ProtectedRoute>} />
        <Route path="/security/alerts" element={<ProtectedRoute requiredRole={['security', 'admin']}><SecurityAlertLog /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
