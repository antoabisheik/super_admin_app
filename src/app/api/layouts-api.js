// api/layouts-api.js
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
// SAVED LAYOUTS API (Camera Placements)
// ===================================================================

export const savedLayoutsApi = {
  // Get all saved layouts for organization or gym
  getAll: async (organizationId, gymId = null) => {
    const gymParam = gymId ? `?gymId=${gymId}` : '';
    return apiCall(`/organizations/${organizationId}/layouts${gymParam}`);
  },

  // Get single saved layout
  getById: async (organizationId, layoutId, gymId = null) => {
    const gymParam = gymId ? `?gymId=${gymId}` : '';
    return apiCall(`/organizations/${organizationId}/layouts/${layoutId}${gymParam}`);
  },

  // Save new layout with camera placements
  create: async (organizationId, layoutData) => {
    return apiCall(`/organizations/${organizationId}/layouts`, {
      method: 'POST',
      body: JSON.stringify(layoutData),
    });
  },

  // Update existing layout
  update: async (organizationId, layoutId, layoutData) => {
    return apiCall(`/organizations/${organizationId}/layouts/${layoutId}`, {
      method: 'PUT',
      body: JSON.stringify(layoutData),
    });
  },

  // Delete saved layout
  delete: async (organizationId, layoutId, gymId = null) => {
    const gymParam = gymId ? `?gymId=${gymId}` : '';
    return apiCall(`/organizations/${organizationId}/layouts/${layoutId}${gymParam}`, {
      method: 'DELETE',
    });
  },
};

// ===================================================================
// CUSTOM LAYOUTS API (Floor Plan Images)
// ===================================================================

export const devicesApi = {
  // Get all devices for organization
  getAll: async (organizationId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.gymId !== undefined) {
      queryParams.append('gymId', filters.gymId);
    }
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    const endpoint = `/organizations/${organizationId}/devices${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  },

  // Get single device
  getById: async (organizationId, deviceId) => {
    return apiCall(`/organizations/${organizationId}/devices/${deviceId}`);
  },
};

export const customLayoutsApi = {
  // Get all custom layout images
  getAll: async (organizationId, gymId = null) => {
    const gymParam = gymId ? `?gymId=${gymId}` : '';
    return apiCall(`/organizations/${organizationId}/custom-layouts${gymParam}`);
  },

  // Upload new custom layout image
  create: async (organizationId, layoutData) => {
    return apiCall(`/organizations/${organizationId}/custom-layouts`, {
      method: 'POST',
      body: JSON.stringify(layoutData),
    });
  },

  // Delete custom layout image
  delete: async (organizationId, layoutId, gymId = null) => {
    const gymParam = gymId ? `?gymId=${gymId}` : '';
    return apiCall(`/organizations/${organizationId}/custom-layouts/${layoutId}${gymParam}`, {
      method: 'DELETE',
    });
  },
};

// Export both APIs
export const layoutsApi = {
  saved: savedLayoutsApi,
  custom: customLayoutsApi,
  devices: devicesApi,
};