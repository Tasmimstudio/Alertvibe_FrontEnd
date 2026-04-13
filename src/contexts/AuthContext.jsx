// contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { userApi } from '../services/api';

const AuthContext = createContext({});

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
        setError(err.message);
      }
      return null;
    }
  };

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in backend
      await userApi.createProfile({
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || null,
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
  const isAdmin = () => userProfile?.role === 'admin';
  const isSecurity = () => userProfile?.role === 'security' || userProfile?.role === 'admin';
  const isUser = () => !!userProfile;
  const getUserRole = () => userProfile?.role || 'user';

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
    // Role helpers
    isAdmin,
    isSecurity,
    isUser,
    getUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
