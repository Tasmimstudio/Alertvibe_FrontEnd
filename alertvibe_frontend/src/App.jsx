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
      <div className="av-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="av-logo" style={{ width: 56, height: 56, borderRadius: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M9 12l2 2 4-4" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="av-spinner" />
          <p className="text-white/40 text-sm font-medium tracking-wide">Loading AlertVibe…</p>
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
  const { ensureDefaultAdmin } = useAuth();

  useEffect(() => {
    // Create default admin account in Firebase if it doesn't exist yet
    ensureDefaultAdmin();

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
    <div className="min-h-screen">
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
