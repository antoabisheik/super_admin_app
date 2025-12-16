// app/api/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sbackend.duckdns.org/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const organizationAPI = {
  // CRUD operations for organizations
  getAll: () => api.get('/api/users/organizations/'),
  get: (id: number) => api.get(`/api/users/organizations/${id}/`),
  create: (data: any) => api.post('/api/users/organizations/', data),
  update: (id: number, data: any) => api.put(`/api/users/organizations/${id}/`, data),
  delete: (id: number) => api.delete(`/api/users/organizations/${id}/`),
};

export const gymAPI = {
  // CRUD operations for gyms
  getAll: (organizationId?: number) => {
    const params = organizationId ? { organization: organizationId } : {};
    return api.get('/api/users/gyms/', { params });
  },
  get: (id: number) => api.get(`/api/users/gyms/${id}/`),
  create: (data: any) => api.post('/api/users/gyms/', data),
  update: (id: number, data: any) => api.put(`/api/users/gyms/${id}/`, data),
  delete: (id: number) => api.delete(`/api/users/gyms/${id}/`),
};

export const cameraAPI = {
  // CRUD operations for cameras
  getAll: (gymId?: number, organizationId?: number) => {
    const params: any = {};
    if (gymId) params.gym = gymId;
    if (organizationId) params.organization = organizationId;
    return api.get('/api/users/cameras/', { params });
  },
  get: (id: number) => api.get(`/api/users/cameras/${id}/`),
  create: (data: any) => api.post('/api/users/cameras/', data),
  update: (id: number, data: any) => api.put(`/api/users/cameras/${id}/`, data),
  delete: (id: number) => api.delete(`/api/users/cameras/${id}/`),
  
  // NEW: Direct camera streaming operations
  getLiveCameras: (ipPrefix: string = '192.168.0.') => 
    api.get('/api/users/cameras/live/', { params: { ip_prefix: ipPrefix } }),
  
  getCamerasBySubnet: (subnet: string) => 
    api.get(`/api/users/cameras/subnet/${subnet}/`),
  
  discoverCameras: (subnet: string = '192.168.0.') => 
    api.post('/api/users/cameras/discover/', { subnet }),
  
  // Direct live stream URL (MJPEG)
  getLiveStreamUrl: (id: number) => 
    `${API_BASE_URL}/api/users/cameras/${id}/live-stream/`,
  
  // Quick snapshot using OpenCV
  getQuickSnapshot: (id: number) => 
    `${API_BASE_URL}/api/users/cameras/${id}/quick-snapshot/`,
  
  // Legacy FFmpeg HLS streaming (keep for backward compatibility)
  startStream: (id: number) => api.post(`/api/users/cameras/${id}/start_stream/`),
  stopStream: (id: number) => api.post(`/api/users/cameras/${id}/stop_stream/`),
  getSnapshot: (id: number) => api.get(`/api/users/cameras/${id}/snapshot/`, { responseType: 'blob' }),
  discoverAndUpdateStatus: () => api.post('/api/users/cameras/discover_and_update_status/'),
  
  // Grid view for frontend
  getGridStatus: (gymId?: number | null, organizationId?: number | null) => {
    const params: any = {};
    if (gymId) params.gym = gymId;
    if (organizationId) params.organization = organizationId;
    return api.get('/api/users/camera-grid/', { params });
  },
  
  // Direct snapshot by IP (legacy)
  getSnapshotByIP: (cameraIP: string) => 
    `${API_BASE_URL}/api/users/cameras/snapshot/${cameraIP}/`,
};

// Types for TypeScript
export type CameraStatus = 'online' | 'offline' | 'recording' | 'maintenance' | 'error' | 'live';

export interface Organization {
  id: number;
  name: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  is_active: boolean;
  gym_count: number;
}

export interface Gym {
  id: number;
  organization: number;
  organization_name: string;
  name: string;
  location: string;
  address?: string;
  manager_name?: string;
  contact_phone?: string;
  created_at: string;
  is_active: boolean;
  camera_count: number;
  online_cameras: number;
}

export interface Camera {
  id: number;
  gym: number;
  gym_name: string;
  organization_name: string;
  name: string;
  ip_address: string;
  rtsp_port: number;
  rtsp_path: string;
  username: string;
  brand?: string;
  model?: string;
  resolution?: string;
  has_ptz: boolean;
  has_audio: boolean;
  status: 'online' | 'offline' | 'recording' | 'maintenance' | 'error';
  is_streaming: boolean;
  stream_url?: string;
  last_seen?: string;
  zone?: string;
  description?: string;
  created_at: string;
  is_active: boolean;
  hls_stream_url?: string;
  rtsp_url: string;
}

// NEW: Live camera response interface
export interface LiveCamera {
  id: number;
  name: string;
  ip_address: string;
  zone?: string;
  gym_name: string;
  organization_name: string;
  rtsp_url: string;
  direct_stream_url: string;
  status: 'live' | 'offline';
  has_ptz: boolean;
  resolution?: string;
}

export interface LiveCamerasResponse {
  count: number;
  cameras: LiveCamera[];
}

export interface SubnetCamerasResponse {
  subnet: string;
  total_cameras: number;
  live_cameras: number;
  cameras: Array<{
    id: number;
    name: string;
    ip_address: string;
    zone?: string;
    gym: {
      id: number;
      name: string;
      organization: string;
    };
    status: 'live' | 'offline';
    is_live: boolean;
    rtsp_url?: string;
    direct_stream_url?: string;
    snapshot_url?: string;
  }>;
}

export default api;
