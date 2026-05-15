import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import Dashboard from './pages/Dashboard';
import AlertHistory from './pages/AlertHistory';
import DeviceRegistration from './pages/DeviceRegistration';
import SecurityDashboard from './pages/SecurityDashboard';
import SecurityAlertLog from './pages/SecurityAlertLog';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetup from './pages/AdminSetup';
import Profile from './pages/Profile';
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
            <img src="/logo.png" alt="AlertVibe" className="w-full h-full object-contain" />
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
  const { currentUser } = useAuth();

  // Request notification permission once the user is logged in
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission().catch(() => {});
    }
  }, [currentUser?.uid]);

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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
