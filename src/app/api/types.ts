// app/api/types.ts
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

// Updated Camera status to include 'live'
export type CameraStatus = 'online' | 'offline' | 'recording' | 'maintenance' | 'error' | 'live';

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
  status: CameraStatus;
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

// Legacy Camera interface for compatibility with existing CameraViewer
export interface LegacyCamera {
  id: string | number;
  name: string;
  location?: string;
  status: CameraStatus;
  stream_url: string | null;
  ip_address?: string;
  direct_stream_url?: string;
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

export interface DiscoverCamerasResponse {
  subnet: string;
  discovered: number;
  offline: number;
  cameras: Array<{
    id: number;
    name: string;
    ip_address: string;
  }>;
}