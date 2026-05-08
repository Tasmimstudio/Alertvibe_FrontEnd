// services/api.js
import { auth } from '../firebaseConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Helper function to get auth token
async function getAuthToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Helper for multipart/form-data uploads (no Content-Type header — browser sets it with boundary)
async function apiUpload(endpoint, formData) {
  const token = await getAuthToken();

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// User API
export const userApi = {
  createProfile: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  verifyToken: async (token) => {
    return apiRequest('/users/verify-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Get current user's role
  getRole: async () => {
    return apiRequest('/users/role');
  },

  // Setup first admin (only works when no admin exists)
  setupAdmin: async (userData) => {
    return apiRequest('/users/setup-admin', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiUpload('/users/profile/photo', formData);
  },

  // Create user with specific role (admin only)
  createWithRole: async (userData) => {
    return apiRequest('/users/create-with-role', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// Alert API
export const alertApi = {
  createAlert: async (alertData) => {
    return apiRequest('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  },

  listAlerts: async () => {
    return apiRequest('/alerts');
  },

  getAlert: async (id) => {
    return apiRequest(`/alerts/${id}`);
  },

  deleteAlert: async (id) => {
    return apiRequest(`/alerts/${id}`, {
      method: 'DELETE',
    });
  },

  saveToken: async (tokenData) => {
    return apiRequest('/alerts/save-token', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  },
};

// Security API
export const securityApi = {
  getDashboard: async () => {
    return apiRequest('/security/dashboard');
  },

  getAlerts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/security/alerts${queryString ? `?${queryString}` : ''}`);
  },

  respondToAlert: async (alertId, responseData) => {
    return apiRequest(`/security/alerts/${alertId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    });
  },

  getMotorcyclesWithOwners: async () => {
    return apiRequest('/security/motorcycles');
  },
};

// Motorcycle API
export const motorcycleApi = {
  listModels: async () => {
    return apiRequest('/motorcycles/models');
  },

  register: async (motorcycleData) => {
    return apiRequest('/motorcycles', {
      method: 'POST',
      body: JSON.stringify(motorcycleData),
    });
  },

  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/motorcycles${queryString ? `?${queryString}` : ''}`);
  },

  get: async (id) => {
    return apiRequest(`/motorcycles/${id}`);
  },

  update: async (id, updates) => {
    return apiRequest(`/motorcycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id) => {
    return apiRequest(`/motorcycles/${id}`, {
      method: 'DELETE',
    });
  },

  toggleActivation: async (id, isActivated) => {
    return apiRequest(`/motorcycles/${id}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ isActivated }),
    });
  },

  updateLocation: async (id, location) => {
    return apiRequest(`/motorcycles/${id}/location`, {
      method: 'PUT',
      body: JSON.stringify({ location }),
    });
  },

  uploadPhoto: async (motorcycleId, file) => {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('photo', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/motorcycles/${motorcycleId}/photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },

  searchByPlate: async (plateNumber) => {
    return apiRequest(`/motorcycles/search?plateNumber=${encodeURIComponent(plateNumber)}`);
  },

  updateWifi: async (id, { ssid, password }) => {
    return apiRequest(`/motorcycles/${id}/wifi`, {
      method: 'PUT',
      body: JSON.stringify({ ssid, password }),
    });
  },
};

// Admin API
export const adminApi = {
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  getAllUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
  },

  updateUserRole: async (userId, role) => {
    return apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  toggleUserStatus: async (userId, active) => {
    return apiRequest(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  },

  deleteUser: async (userId) => {
    return apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  getAllAlerts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/alerts${queryString ? `?${queryString}` : ''}`);
  },

  respondToAlert: async (alertId, responseData) => {
    return apiRequest(`/admin/alerts/${alertId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(responseData),
    });
  },

  bulkDeleteAlerts: async (alertIds) => {
    return apiRequest('/admin/alerts/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ alertIds }),
    });
  },

  getSystemLogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/logs${queryString ? `?${queryString}` : ''}`);
  },
};

export default {
  user: userApi,
  alert: alertApi,
  motorcycle: motorcycleApi,
  security: securityApi,
  admin: adminApi,
};
