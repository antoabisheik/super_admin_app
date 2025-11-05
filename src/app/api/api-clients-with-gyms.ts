import { auth } from '../api/firebase';
import { User } from "firebase/auth"; // 👈 add this import
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://webapps-middleware.onrender.com/api';


interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  role?: string;
  tags?: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Gym {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  manager: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | 'INACTIVE';
  openingTime?: string;
  closingTime?: string;
  amenities?: string[];
  latitude?: number | null;
  longitude?: number | null;
  members?: number;
  monthlyRevenue?: number;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}




async function getAuthToken(): Promise<string> {
  const currentUser = await new Promise<User | null>((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      resolve(user);
    });
  });

  if (!currentUser) {
    throw new Error("User not authenticated");
  }

  return await currentUser.getIdToken();
}


async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error: any) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error.message || 'Network request failed',
    };
  }
}



export const organizationsApi = {
  
  getAll: async (): Promise<ApiResponse<Organization[]>> => {
    return await apiRequest('/organizations');
  },

  
  getById: async (id: string): Promise<ApiResponse<Organization>> => {
    return await apiRequest(`/organizations/${id}`);
  },

  
  create: async (organizationData: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    return await apiRequest('/organizations', {
      method: 'POST',
      body: JSON.stringify(organizationData),
    });
  },

  
  update: async (id: string, organizationData: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    return await apiRequest(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organizationData),
    });
  },

  
  delete: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return await apiRequest(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },
};


export const devicesApi = {
  
  getAll: async (organizationId: string): Promise<ApiResponse<Device[]>> => {
    return await apiRequest(`/devices`);
  },

 
  getById: async (organizationId: string, deviceId: string): Promise<ApiResponse<Device>> => {
    return await apiRequest(`/devices/${deviceId}`);
  },

  
  create: async (organizationId: string, deviceData: Partial<Device>): Promise<ApiResponse<Device>> => {
    return await apiRequest(`/devices`, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  },

  
  update: async (organizationId: string, deviceId: string, deviceData: Partial<Device>): Promise<ApiResponse<Device>> => {
    return await apiRequest(`/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
  },

  delete: async (organizationId: string, deviceId: string): Promise<ApiResponse<{ id: string }>> => {
    return await apiRequest(`/devices/${deviceId}`, {
      method: 'DELETE',
    });
  },
};


export const gymsApi = {
  
  getAll: async (organizationId: string): Promise<ApiResponse<Gym[]>> => {
    return await apiRequest(`/organizations/${organizationId}/gyms`);
  },


  getById: async (organizationId: string, gymId: string): Promise<ApiResponse<Gym>> => {
    return await apiRequest(`/organizations/${organizationId}/gyms/${gymId}`);
  },

 
  create: async (organizationId: string, gymData: Partial<Gym>): Promise<ApiResponse<Gym>> => {
    return await apiRequest(`/organizations/${organizationId}/gyms`, {
      method: 'POST',
      body: JSON.stringify(gymData),
    });
  },

  
  update: async (organizationId: string, gymId: string, gymData: Partial<Gym>): Promise<ApiResponse<Gym>> => {
    return await apiRequest(`/organizations/${organizationId}/gyms/${gymId}`, {
      method: 'PUT',
      body: JSON.stringify(gymData),
    });
  },

 
  delete: async (organizationId: string, gymId: string): Promise<ApiResponse<{ id: string }>> => {
    return await apiRequest(`/organizations/${organizationId}/gyms/${gymId}`, {
      method: 'DELETE',
    });
  },
};


export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};


export const getCurrentUser = () => {
  return auth.currentUser;
};


export const refreshAuthToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }
  return await currentUser.getIdToken(true); // Force refresh
};

export default {
  organizations: organizationsApi,
  devices: devicesApi,
  gyms: gymsApi,
  isAuthenticated,
  getCurrentUser,
  refreshAuthToken,
};

export { licensesApi } from './licenses-api';
export { notificationsApi } from './notifications-api';