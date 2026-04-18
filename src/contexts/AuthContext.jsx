// contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { userApi } from '../services/api';

const AuthContext = createContext({});

// Default admin email (created by the backend on first start)
const DEFAULT_ADMIN_EMAIL = 'admin@alertvibe.com';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile from backend
  const fetchUserProfile = async (user) => {
    try {
      const profile = await userApi.getProfile();
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // If profile doesn't exist, create it
      if (err.message.includes('404') || err.message.includes('not found')) {
        try {
          const newProfile = await userApi.createProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
          });
          setUserProfile(newProfile.user);
          return newProfile.user;
        } catch (createErr) {
          console.error('Error creating user profile:', createErr);
          setError(createErr.message);
        }
      } else {
        // Backend unreachable — use a minimal fallback so the app can still navigate
        const fallback = { uid: user.uid, email: user.email, role: 'user' };
        setUserProfile(fallback);
        return fallback;
      }
      return null;
    }
  };

  // No-op: admin account is created server-side on backend startup
  const ensureDefaultAdmin = async () => {};

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in backend (non-blocking — backend may be cold-starting)
      userApi.createProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || null,
      }).catch((err) => {
        console.warn('Profile creation failed (will retry on next login):', err.message);
      });

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Create or update user profile in backend
      try {
        await userApi.getProfile();
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('not found')) {
          await userApi.createProfile({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || null,
            photoURL: result.user.photoURL || null,
          });
        }
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const updated = await userApi.updateProfile(profileData);
      await fetchUserProfile(currentUser);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper functions for role checking
  const isDefaultAdmin = () => currentUser?.email === DEFAULT_ADMIN_EMAIL;
  const isAdmin = () => isDefaultAdmin() || userProfile?.role === 'admin';
  const isSecurity = () => isDefaultAdmin() || userProfile?.role === 'security' || userProfile?.role === 'admin';
  const isUser = () => !!userProfile || isDefaultAdmin();
  const getUserRole = () => isDefaultAdmin() ? 'admin' : (userProfile?.role || 'user');

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    signInWithGoogle,
    updateProfile,
    fetchUserProfile,
    ensureDefaultAdmin,
    DEFAULT_ADMIN_EMAIL,
    // Role helpers
    isAdmin,
    isSecurity,
    isUser,
    getUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
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
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
