// api/licenses-api.js
import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sbackend.duckdns.org/api';

// Helper to get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken();
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        status: response.status,
      };
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('API call error:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};

// ===================================================================
// LICENSES API
// ===================================================================

export const licensesApi = {
  // Get all licenses
  getAll: async (limit = 100) => {
    return apiCall(`/licenses?limit=${limit}`);
  },

  // Get single license by ID
  getById: async (licenseId) => {
    return apiCall(`/licenses/${licenseId}`);
  },

  // Get licenses for specific organization
  getByOrganization: async (organizationId) => {
    return apiCall(`/organizations/${organizationId}/licenses`);
  },

  // Create new license
  create: async (licenseData) => {
    return apiCall(`/licenses`, {
      method: 'POST',
      body: JSON.stringify(licenseData),
    });
  },

  // Update existing license
  update: async (licenseId, licenseData) => {
    return apiCall(`/licenses/${licenseId}`, {
      method: 'PUT',
      body: JSON.stringify(licenseData),
    });
  },

  // Delete license
  delete: async (licenseId) => {
    return apiCall(`/licenses/${licenseId}`, {
      method: 'DELETE',
    });
  },

  // Validate license key
  validate: async (licenseKey) => {
    return apiCall(`/licenses/validate/${licenseKey}`);
  },
};

export default licensesApi;