// api/notifications-api.js
import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://webapps-middleware.onrender.com/api';

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
// NOTIFICATION TEMPLATES API
// ===================================================================

export const notificationTemplatesApi = {
  // Get all templates
  getAll: async () => {
    return apiCall(`/notification-templates`);
  },

  // Get single template
  getById: async (templateId) => {
    return apiCall(`/notification-templates/${templateId}`);
  },

  // Create template
  create: async (templateData) => {
    return apiCall(`/notification-templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  // Update template
  update: async (templateId, templateData) => {
    return apiCall(`/notification-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },

  // Delete template
  delete: async (templateId) => {
    return apiCall(`/notification-templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// ===================================================================
// SCHEDULED NOTIFICATIONS API
// ===================================================================

export const scheduledNotificationsApi = {
  // Get all scheduled notifications
  getAll: async () => {
    return apiCall(`/scheduled-notifications`);
  },

  // Get single scheduled notification
  getById: async (notificationId) => {
    return apiCall(`/scheduled-notifications/${notificationId}`);
  },

  // Create scheduled notification
  create: async (notificationData) => {
    return apiCall(`/scheduled-notifications`, {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Update scheduled notification
  update: async (notificationId, notificationData) => {
    return apiCall(`/scheduled-notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(notificationData),
    });
  },

  // Delete scheduled notification
  delete: async (notificationId) => {
    return apiCall(`/scheduled-notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// ===================================================================
// NOTIFICATION HISTORY API
// ===================================================================

export const notificationHistoryApi = {
  // Get all notification history
  getAll: async (limit = 100) => {
    return apiCall(`/notification-history?limit=${limit}`);
  },

  // Get single notification history
  getById: async (historyId) => {
    return apiCall(`/notification-history/${historyId}`);
  },

  // Create notification history (send notification)
  create: async (notificationData) => {
    return apiCall(`/notification-history`, {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },
};

// ===================================================================
// NOTIFICATION CONFIG API
// ===================================================================

export const notificationConfigApi = {
  // Get all configs
  getAll: async () => {
    return apiCall(`/notification-config`);
  },

  // Get config by type (email, sms, push)
  getByType: async (configType) => {
    return apiCall(`/notification-config/${configType}`);
  },

  // Update config
  update: async (configType, configData) => {
    return apiCall(`/notification-config/${configType}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  },
};

// ===================================================================
// RECIPIENT STATS API
// ===================================================================

export const recipientStatsApi = {
  // Get recipient counts
  getStats: async () => {
    return apiCall(`/notifications/recipient-stats`);
  },
};

// Export combined notifications API
export const notificationsApi = {
  templates: notificationTemplatesApi,
  scheduled: scheduledNotificationsApi,
  history: notificationHistoryApi,
  config: notificationConfigApi,
  recipients: recipientStatsApi,
};

export default notificationsApi;