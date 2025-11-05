// lib/api-client.ts (in your Next.js app)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://webapps-middleware.onrender.com/api';

/**
 * Get auth token from Firebase
 */
async function getAuthToken(): Promise<string | null> {
  // If using Firebase Auth in the frontend
  if (typeof window !== 'undefined') {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      return await user.getIdToken();
    }
  }
  return null;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error);
    return {
      success: false,
      error: error.message || 'An error occurred'
    };
  }
}

// ==================== ORGANIZATIONS API ====================

export const organizationsApi = {
  /**
   * Fetch all organizations
   */
  async getAll(params?: { limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/organizations${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<any[]>(endpoint, { method: 'GET' });
  },

  /**
   * Fetch single organization
   */
  async getById(id: string) {
    return apiRequest<any>(`/organizations/${id}`, { method: 'GET' });
  },

  /**
   * Create new organization
   */
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    status?: string;
  }) {
    return apiRequest<any>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update organization
   */
  async update(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
  }>) {
    return apiRequest<any>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete organization
   */
  async delete(id: string) {
    return apiRequest<any>(`/organizations/${id}`, { method: 'DELETE' });
  },
};

// ==================== DEVICES API ====================

export const devicesApi = {
  /**
   * Fetch all devices with optional filters
   */
  async getAll(params?: {
    limit?: number;
    organizationId?: string;
    type?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    
    const endpoint = `/devices${queryParams.toString() ? `?${queryParams}` : ''}`;
    return apiRequest<any[]>(endpoint, { method: 'GET' });
  },

  /**
   * Fetch single device
   */
  async getById(id: string) {
    return apiRequest<any>(`/devices/${id}`, { method: 'GET' });
  },

  /**
   * Create new device
   */
  async create(data: {
    deviceName: string;
    type: string;
    serialNumber: string;
    model?: string;
    manufacturer?: string;
    organizationId?: string;
    status?: string;
    location?: string;
    ipAddress?: string;
    macAddress?: string;
  }) {
    return apiRequest<any>('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update device
   */
  async update(id: string, data: Partial<{
    deviceName: string;
    type: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
    organizationId: string | null;
    status: string;
    location: string;
    ipAddress: string;
    macAddress: string;
  }>) {
    return apiRequest<any>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete device
   */
  async delete(id: string) {
    return apiRequest<any>(`/devices/${id}`, { method: 'DELETE' });
  },

  /**
   * Bulk assign devices to organization
   */
  async bulkAssign(deviceIds: string[], organizationId: string | null) {
    return apiRequest<any>('/devices/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ deviceIds, organizationId }),
    });
  },
};
